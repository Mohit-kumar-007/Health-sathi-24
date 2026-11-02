// Loads the catalogue from backend/content: categories and courses from catalog.json, and each course's
// lessons from lessons/<course-slug>.json when that file exists. Safe to re-run: it only adds what is missing
// and never overwrites a category, course or lesson an admin has since edited.
// Usage: npm run seed
//        npm run seed -- --reset    clear categories, courses, lessons and progress first (local database only)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import mongoose, { type Types } from 'mongoose'
import { z } from 'zod'
import { config } from '../src/config'
import { Category, ICON_KEYS } from '../src/models/Category'
import { Chapter } from '../src/models/Chapter'
import { Course } from '../src/models/Course'
import { Lesson } from '../src/models/Lesson'
import { Progress } from '../src/models/Progress'

const CONTENT_DIR = join(import.meta.dirname, '..', 'content')
const SORT_STEP = 10
const LOCAL_DATABASE = /^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/

const catalogSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().min(1),
      iconKey: z.enum(ICON_KEYS),
    }),
  ),
  courses: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      categorySlug: z.string().min(1),
      description: z.string().min(1),
      sortOrder: z.number(),
    }),
  ),
})

const lessonsSchema = z.array(
  z.object({
    title: z.string().min(1),
    youtubeVideoId: z.string().regex(/^[\w-]{11}$/),
    notes: z.string(),
  }),
)

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

const isReset = process.argv.includes('--reset')
if (isReset && !LOCAL_DATABASE.test(config.MONGODB_URI)) {
  console.error('--reset only runs against a database on this computer, to protect real data. Nothing was changed.')
  process.exit(1)
}

const catalog = catalogSchema.parse(readJson(join(CONTENT_DIR, 'catalog.json')))
await mongoose.connect(config.MONGODB_URI)

if (isReset) {
  await Promise.all([
    Progress.deleteMany({}),
    Lesson.deleteMany({}),
    Chapter.deleteMany({}),
    Course.deleteMany({}),
    Category.deleteMany({}),
  ])
  console.log('Catalogue cleared. Accounts were not touched.')
}

const added = { categories: 0, courses: 0, lessons: 0 }
let coursesWithoutLessons = 0
const categoryIds = new Map<string, Types.ObjectId>()

for (const [index, seed] of catalog.categories.entries()) {
  const result = await Category.updateOne(
    { slug: seed.slug },
    {
      $setOnInsert: {
        name: seed.name,
        description: seed.description,
        iconKey: seed.iconKey,
        sortOrder: (index + 1) * SORT_STEP,
        status: 'active',
      },
    },
    { upsert: true },
  )
  added.categories += result.upsertedCount

  const category = await Category.findOne({ slug: seed.slug })
  if (!category) throw new Error(`Category "${seed.name}" was not found after saving it.`)
  categoryIds.set(seed.slug, category._id)
}

for (const seed of catalog.courses) {
  const categoryId = categoryIds.get(seed.categorySlug)
  if (!categoryId) throw new Error(`Course "${seed.title}" names an unknown category "${seed.categorySlug}".`)

  const result = await Course.updateOne(
    { slug: seed.slug },
    {
      $setOnInsert: {
        categoryId,
        title: seed.title,
        description: seed.description,
        sortOrder: seed.sortOrder,
        status: 'published',
      },
    },
    { upsert: true },
  )
  added.courses += result.upsertedCount

  const course = await Course.findOne({ slug: seed.slug })
  if (!course) throw new Error(`Course "${seed.title}" was not found after saving it.`)

  const lessonsFile = join(CONTENT_DIR, 'lessons', `${seed.slug}.json`)
  if (!existsSync(lessonsFile)) {
    coursesWithoutLessons += 1
    continue
  }
  for (const [index, lesson] of lessonsSchema.parse(readJson(lessonsFile)).entries()) {
    const saved = await Lesson.updateOne(
      { courseId: course._id, youtubeVideoId: lesson.youtubeVideoId },
      {
        $setOnInsert: {
          title: lesson.title,
          notes: lesson.notes,
          sortOrder: (index + 1) * SORT_STEP,
          status: 'published',
        },
      },
      { upsert: true },
    )
    added.lessons += saved.upsertedCount
  }
}

console.log(
  `Seed finished: ${added.categories} categories, ${added.courses} courses and ${added.lessons} lessons added.`,
)
if (coursesWithoutLessons > 0) {
  console.log(`${coursesWithoutLessons} courses have no lesson file and will show "Lessons coming soon".`)
}
await mongoose.disconnect()
