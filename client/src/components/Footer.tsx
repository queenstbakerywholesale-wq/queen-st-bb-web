/**
 * Footer — Minimal editorial footer
 * Design: "Atelier Dolce" — thin rules, editorial typography, warm tones
 */
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-espresso text-ivory/80 py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Brand */}
        <div className="mb-12">
          <h2
            className="text-2xl md:text-3xl font-light tracking-editorial text-ivory"
            style={{ fontFamily: "var(--font-display)" }}
          >
            QUEEN ST BB
          </h2>
          <div className="editorial-rule mt-4 !bg-ivory/30" />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          <div>
            <h3
              className="text-[11px] font-medium uppercase tracking-editorial text-ivory/50 mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Collections
            </h3>
            <ul className="space-y-2">
              {["Tiramisu", "Gelato", "Objects"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                  >
                    <span
                      className="text-sm font-light text-ivory/70 hover:text-ivory transition-colors duration-300"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {item}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-[11px] font-medium uppercase tracking-editorial text-ivory/50 mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Experience
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Space", href: "/space" },
                { label: "Cake Booking", href: "/cake-booking" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span
                      className="text-sm font-light text-ivory/70 hover:text-ivory transition-colors duration-300"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-[11px] font-medium uppercase tracking-editorial text-ivory/50 mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Business
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Wholesale & Franchise", href: "/wholesale" },
                { label: "About", href: "/about" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span
                      className="text-sm font-light text-ivory/70 hover:text-ivory transition-colors duration-300"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-[11px] font-medium uppercase tracking-editorial text-ivory/50 mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/customer-care">
                  <span
                    className="text-sm font-light text-ivory/70 hover:text-ivory transition-colors duration-300"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Customer Care
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-ivory/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="text-[11px] font-light text-ivory/40 tracking-wide"
            style={{ fontFamily: "var(--font-body)" }}
          >
            &copy; {new Date().getFullYear()} Queen St BB. All rights reserved.
          </p>
          <p
            className="text-[11px] font-light text-ivory/40 tracking-wide"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Crafted with care in the atelier
          </p>
        </div>
      </div>
    </footer>
  );
}
