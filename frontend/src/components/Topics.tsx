import { TopicArt, type TopicArtKind } from './TopicArt'

interface Topic {
  kind: TopicArtKind
  name: string
  text: string
  courses: string[]
}

const TOPICS: Topic[] = [
  {
    kind: 'prevention',
    name: 'Health Prevention',
    text: 'Understand the basics of staying ahead with awareness and regular check-ins.',
    courses: ['Blood Pressure Awareness', 'Diabetes Awareness', 'Checkup Basics', 'Immunity Support'],
  },
  {
    kind: 'body',
    name: 'Body Care',
    text: 'Gentle everyday care for your back, skin, hair, teeth and hydration.',
    courses: ['Back and Mobility', 'Healthy Feet', 'Healthy Teeth', 'Healthy Hydration'],
  },
  {
    kind: 'mind',
    name: 'Mental Health',
    text: 'Learn to notice stress and rest, and build calmer routines.',
    courses: ['Sleep Balance', 'Understanding Emotions', 'Anxiety Awareness', 'Everyday Stress'],
  },
  {
    kind: 'daily',
    name: 'Everyday Activities',
    text: 'Simple habits around food, movement and routine that fit real life.',
    courses: ['Healthy Eating', 'Everyday Movement', 'Healthy Routines', 'Hydration Habits'],
  },
]

export function Topics() {
  return (
    <section id="topics" aria-labelledby="topics-heading" className="bg-pale/60 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wider text-teal-text">Topics</p>
        <h2 id="topics-heading" className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Four areas to explore, one step at a time
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Example courses are shown below. Log in to see the full library as it grows.
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {TOPICS.map((topic) => (
            <li key={topic.name} className="overflow-hidden rounded-2xl border border-pale bg-white">
              <div className="aspect-[16/9]">
                <TopicArt kind={topic.kind} label={`Illustration for ${topic.name}`} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-extrabold text-navy">{topic.name}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{topic.text}</p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Example courses in ${topic.name}`}>
                  {topic.courses.map((course) => (
                    <li key={course} className="rounded-full bg-mint px-3 py-1 text-[13px] font-medium text-primary-dark">
                      {course}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
