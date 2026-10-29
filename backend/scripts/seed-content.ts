// Loads the starter catalogue from the PRD (Appendix A). Safe to re-run: it only inserts what is missing
// and never overwrites a category or course an admin has since edited.
// Usage: npm run seed
import mongoose from 'mongoose'
import { config } from '../src/config'
import { Category, type IconKey } from '../src/models/Category'
import { Course } from '../src/models/Course'

type CourseSeed = [title: string, description: string]

interface CategorySeed {
  name: string
  description: string
  iconKey: IconKey
  courses: CourseSeed[]
}

const CATALOG: CategorySeed[] = [
  {
    name: 'Health Prevention',
    description: 'Understand the basics of staying ahead with awareness and regular check-ins.',
    iconKey: 'prevention',
    courses: [
      ['Blood Pressure Awareness', 'What blood pressure is, why it matters, and everyday habits that support healthy levels.'],
      ['Diabetes Awareness', 'Plain-language basics about blood sugar and the daily choices that support balance.'],
      ['Checkup Basics', 'What routine health checkups are for and how to get ready for them.'],
      ['Immunity Support', 'How your body defends itself and the everyday habits that help.'],
      ['Allergy Awareness', 'Understand common triggers and simple ways to prepare for allergy season.'],
      ['Healthy Liver Habits', 'Everyday food and lifestyle habits that look after your liver.'],
    ],
  },
  {
    name: 'Body Care',
    description: 'Gentle everyday care for your back, skin, hair, teeth and hydration.',
    iconKey: 'body',
    courses: [
      ['Back and Mobility', 'Posture, gentle movement and habits for a more comfortable back.'],
      ['Healthy Feet', 'Simple foot care routines for comfort and easy movement.'],
      ['Healthy Hair', 'Gentle care routines for healthy hair and scalp.'],
      ['Skin Health', 'Everyday skin care basics, sun habits and hydration.'],
      ['Healthy Teeth', 'Brushing, flossing and food habits for a healthy smile.'],
      ['Healthy Hydration', 'Why water matters and easy ways to drink enough through the day.'],
      ['Understanding Your Cycle', 'A clear introduction to the menstrual cycle and what to expect.'],
    ],
  },
  {
    name: 'Mental Health',
    description: 'Learn to notice stress and rest, and build calmer routines.',
    iconKey: 'mind',
    courses: [
      ['Sleep Balance', 'Build a calmer evening routine and steadier sleep habits.'],
      ['Understanding Emotions', 'Notice, name and make sense of everyday feelings.'],
      ['Anxiety Awareness', 'What anxiety is, how it can show up, and practical ways to cope.'],
      ['Everyday Stress', 'Spot daily stress and try small habits that help you reset.'],
    ],
  },
  {
    name: 'Everyday Activities',
    description: 'Simple habits around food, movement and routine that fit real life.',
    iconKey: 'daily',
    courses: [
      ['Healthy Eating', 'Balanced plates and simple, practical food choices.'],
      ['Everyday Movement', 'Easy ways to add movement to a busy day.'],
      ['Healthy Routines', 'Small daily rhythms that make healthy choices stick.'],
      ['Hydration Habits', 'Habits that help you remember to drink water regularly.'],
    ],
  },
]

const SORT_STEP = 10

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

await mongoose.connect(config.MONGODB_URI)

let categoriesAdded = 0
let coursesAdded = 0

for (const [categoryIndex, seed] of CATALOG.entries()) {
  const slug = slugify(seed.name)
  const upsert = await Category.updateOne(
    { slug },
    {
      $setOnInsert: {
        name: seed.name,
        description: seed.description,
        iconKey: seed.iconKey,
        sortOrder: (categoryIndex + 1) * SORT_STEP,
        status: 'active',
      },
    },
    { upsert: true },
  )
  categoriesAdded += upsert.upsertedCount

  const category = await Category.findOne({ slug })
  if (!category) throw new Error(`Category "${seed.name}" was not found after saving it.`)

  for (const [courseIndex, [title, description]] of seed.courses.entries()) {
    const result = await Course.updateOne(
      { slug: slugify(title) },
      {
        $setOnInsert: {
          categoryId: category._id,
          title,
          description,
          sortOrder: (courseIndex + 1) * SORT_STEP,
          status: 'published',
        },
      },
      { upsert: true },
    )
    coursesAdded += result.upsertedCount
  }
}

console.log(`Seed finished: ${categoriesAdded} categories and ${coursesAdded} courses added.`)
await mongoose.disconnect()
