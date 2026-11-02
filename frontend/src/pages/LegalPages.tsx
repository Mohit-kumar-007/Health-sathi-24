import { LegalLayout, LegalSection } from '../components/LegalLayout'

const CONTACT_EMAIL = 'contact@healthsathi24.com'
const UPDATED = '2 November 2026'

function Email() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-teal-text underline">
      {CONTACT_EMAIL}
    </a>
  )
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-text underline">
      {children}
    </a>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated={UPDATED}>
      <LegalSection title="Who we are">
        <p>
          HealthSathi24 offers short video lessons and notes about everyday health topics. This policy explains what
          information we collect when you use the site, why, and what choices you have. You can reach us at <Email />.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <ul className="list-disc space-y-2 pl-6 marker:text-leaf">
          <li>
            <strong className="text-navy">Account details.</strong> Our team creates your account, so we hold your login ID
            and the name we gave it. Your password is stored only as a one-way scrambled value (a hash). We cannot read
            it.
          </li>
          <li>
            <strong className="text-navy">Learning activity.</strong> Which lessons you mark as complete and when, and
            the time of your last login. This is how we save your place.
          </li>
          <li>
            <strong className="text-navy">A sign-in cookie.</strong> When you log in, we set one cookie that keeps you
            signed in. It is needed for the site to work. It is not used for advertising.
          </li>
          <li>
            <strong className="text-navy">Technical logs.</strong> Our hosting providers may record standard technical
            details such as your IP address and browser type, to keep the service secure and running.
          </li>
        </ul>
        <p>
          We do not collect medical records, diagnoses, or payment details. We do not use advertising or analytics
          trackers.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          We use this information to let you sign in, show you your lessons, remember your progress, keep the service
          secure, and answer your questions. We do not sell your information.
        </p>
      </LegalSection>

      <LegalSection title="Videos from YouTube">
        <p>
          Lesson videos are played from YouTube using its privacy-enhanced mode. When you press play, YouTube (Google) may
          collect information about your viewing under its own policies. See the{' '}
          <ExternalLink href="https://policies.google.com/privacy">Google Privacy Policy</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Who else handles your information">
        <p>
          We use hosting and database providers to run the site. They process information on our behalf and only to
          provide that service. We do not share your information with anyone else unless the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep your account and progress while your account exists. When our team deletes an account, its details and
          progress are deleted too. Backups may hold older copies for a short period before they are overwritten.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can ask us to correct your details, tell you what we hold about you, or delete your account. Email <Email />.
          Because accounts are managed by our team, password resets are also done by us.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We protect the site with encrypted connections, hashed passwords and access controls. No system is perfectly
          secure, so please keep your password private and tell us straight away if you think someone else has it.
        </p>
      </LegalSection>

      <LegalSection title="Who this is for">
        <p>
          The site is intended for adults. If you are under 18, please use it with a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>If we change this policy we will update the date at the top of this page.</p>
      </LegalSection>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms and Conditions" updated={UPDATED}>
      <LegalSection title="Using HealthSathi24">
        <p>
          By using the site you agree to these terms. HealthSathi24 accounts are created by our team. There is no public
          sign-up. Your login is for you alone, so please do not share it.
        </p>
      </LegalSection>

      <LegalSection title="Education, not medical advice">
        <p>
          Everything on HealthSathi24 is general health information for learning. It is not medical advice and does not
          replace a qualified health professional. It cannot diagnose, treat or prevent any condition, and it does not
          promise any health result.
        </p>
        <p>
          Please talk to a qualified health professional about your own situation. If you think you or someone else may be
          having a medical emergency, call your local emergency number (112 in India) or go to the nearest hospital. Do not
          wait for a lesson or a reply from us.
        </p>
      </LegalSection>

      <LegalSection title="Fair use">
        <p>Please do not:</p>
        <ul className="list-disc space-y-2 pl-6 marker:text-leaf">
          <li>share your login or let others use your account;</li>
          <li>copy, record or republish our lessons and notes without our written permission;</li>
          <li>try to break into, overload or disrupt the site.</li>
        </ul>
        <p>We may suspend or delete an account that is misused.</p>
      </LegalSection>

      <LegalSection title="Our content and third-party videos">
        <p>
          The notes, design and text on this site belong to HealthSathi24 or the people who license them to us. Videos are
          played from YouTube and remain the property of their owners.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          We work to keep the site available, but we cannot promise it will always be uninterrupted or error-free. We may
          change, add or remove lessons at any time.
        </p>
      </LegalSection>

      <LegalSection title="Our responsibility">
        <p>
          To the extent the law allows, HealthSathi24 is not responsible for decisions you make based on the lessons, or for
          losses that result from using the site. Nothing here limits any right you have that cannot be limited by law.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          We may update these terms and will change the date at the top when we do. Questions? Email <Email />. These terms
          are governed by the laws of India.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}

export function ContactPage() {
  return (
    <LegalLayout title="Contact" updated={UPDATED}>
      <LegalSection title="Get in touch">
        <p>
          For questions, feedback or help with your account, email us at <Email />.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and passwords">
        <p>
          HealthSathi24 accounts are created by our team, and there is no public sign-up. If you need an account, or your
          password has been lost, contact us or the person who gave you access, and we will set it up for you.
        </p>
      </LegalSection>

      <LegalSection title="Health questions">
        <p>
          We cannot give personal medical advice. Please speak with a qualified health professional about your own health. In
          an emergency, call your local emergency number (112 in India).
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
