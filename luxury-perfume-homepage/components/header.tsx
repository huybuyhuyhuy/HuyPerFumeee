"use client";

import { useState } from "react";
import { Menu, X, Search, ShoppingBag, User, Phone } from "lucide-react";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Nam", href: "/nam" },
  { label: "Nữ", href: "/nu" },
  { label: "Unisex", href: "/unisex" },
  { label: "Quà tặng", href: "/qua-tang" },
  { label: "Bán chạy", href: "/ban-chay" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>Hotline: 1900 8888</span>
          </div>
          <p className="text-muted-foreground">
            Miễn phí vận chuyển cho đơn hàng từ 500.000đ
          </p>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl lg:text-3xl font-semibold tracking-tight">
              Huy<span className="text-accent">Perfume</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-accent transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="p-2 hover:text-accent transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:text-accent transition-colors"
              aria-label="Tài khoản"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:text-accent transition-colors relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-3 px-4 text-sm font-medium hover:bg-secondary rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>Hotline: 1900 8888</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
