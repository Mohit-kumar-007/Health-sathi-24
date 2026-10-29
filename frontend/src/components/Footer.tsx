import { Logo } from './Logo'

const LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms and Conditions', href: '/terms' },
  { label: 'Contact', href: '#contact' },
]

export function Footer() {
  return (
    <footer id="contact" className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Logo light showTagline />
            <p className="mt-4 text-sm leading-relaxed text-white/75">Small steps today. Healthier tomorrows.</p>
          </div>
          <nav aria-label="Footer navigation">
            <ul className="space-y-2.5 text-sm">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/85 hover:text-white hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="text-white/75">Email: contact@healthsathi24.com</li>
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-xs leading-relaxed text-white/70">
          HealthSathi24 shares general health education only. It is not a substitute for professional medical advice, diagnosis or
          treatment. For personal health concerns, please speak with a qualified health professional.
        </p>
        <p className="mt-3 text-xs text-white/60">© 2026 HealthSathi24. All rights reserved.</p>
      </div>
    </footer>
  )
}
