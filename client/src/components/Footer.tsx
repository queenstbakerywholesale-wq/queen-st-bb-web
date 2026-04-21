/**
 * Footer — Luxury editorial footer
 * Typography: Playfair Display 500 for brand, Inter 500 for section labels
 * Warm brown background, cream text with strong contrast
 */
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer
      className="py-16 md:py-24 px-6 md:px-10"
      style={{ backgroundColor: "oklch(0.34 0.05 45)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Brand */}
        <div className="mb-12">
          <h2
            className="text-xl md:text-2xl"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: "#FFFFFF",
            }}
          >
            Queen St BB
          </h2>
          <div
            className="mt-4"
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          />
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-16">
          <div>
            <h3
              className="text-[11px] uppercase mb-4"
              style={{
                fontFamily: "var(--font-nav)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Collections
            </h3>
            <ul className="space-y-2">
              {["Tiramisu", "Gelato", "Objects"].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase()}`}>
                    <span
                      className="text-sm transition-colors duration-300 hover:opacity-100"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.7)",
                      }}
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
              className="text-[11px] uppercase mb-4"
              style={{
                fontFamily: "var(--font-nav)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "rgba(255,255,255,0.5)",
              }}
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
                      className="text-sm transition-colors duration-300 hover:opacity-100"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.7)",
                      }}
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
              className="text-[11px] uppercase mb-4"
              style={{
                fontFamily: "var(--font-nav)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "rgba(255,255,255,0.5)",
              }}
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
                      className="text-sm transition-colors duration-300 hover:opacity-100"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.7)",
                      }}
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
              className="text-[11px] uppercase mb-4"
              style={{
                fontFamily: "var(--font-nav)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/customer-care">
                  <span
                    className="text-sm transition-colors duration-300 hover:opacity-100"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Customer Care
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p
            className="text-[11px]"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            &copy; {new Date().getFullYear()} Queen St BB. All rights reserved.
          </p>
          <p
            className="text-[11px]"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Crafted with care
          </p>
        </div>
      </div>
    </footer>
  );
}
