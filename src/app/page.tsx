import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Users, BookOpen, DollarSign, BarChart3, CheckCircle2, Shield, Cloud, Smartphone, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b-2 border-orange-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image
                src="/orhcid_logo_black_font.svg"
                alt="Orchid Software"
                width={140}
                height={40}
                className="brightness-0 invert"
              />
              <span className="text-lg font-semibold text-orange-500">/ Shiksha</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-orange-500 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-orange-500 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-300 hover:text-orange-500 transition-colors">Testimonials</a>
              <Link href="/login" className="text-gray-300 hover:text-orange-500 transition-colors">
                Log In
              </Link>
              <a
                href="#pricing"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-900/30 border border-orange-500/30 rounded-full mb-6">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-300 text-sm">Built for Modern Schools & Educational Institutions</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight">
            Transform Education
            <br />
            Management Into
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-400 to-orange-400 bg-clip-text text-transparent">
              Digital Excellence
            </span>
          </h1>

          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mb-12">
            Streamline administrative operations, enhance communication, and improve efficiency with our
            comprehensive cloud-based School Management System. From 100 to 10,000+ students.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              href="#pricing"
              className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-500 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-600 transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-orange-500/50 rounded-lg font-semibold text-lg hover:bg-orange-900/30 transition-all"
            >
              See How It Works
            </a>
          </div>

          <p className="text-center text-gray-400 text-sm">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-orange-900/20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent mb-2">
                80%
              </div>
              <div className="text-gray-400">Less Paperwork</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent mb-2">
                <span className="text-3xl">&lt;</span>2sec
              </div>
              <div className="text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent mb-2">
                8+
              </div>
              <div className="text-gray-400">Core Modules</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-gray-400">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need in
              <span className="bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent"> One Platform</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for schools, teachers, parents, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Student Management"
              description="Complete student profiles, admission tracking, bulk import via CSV/Excel, and comprehensive academic records."
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="Attendance Tracking"
              description="Daily attendance marking for students and staff with real-time analytics and automated notifications."
            />
            <FeatureCard
              icon={<DollarSign className="h-8 w-8" />}
              title="Fee Management"
              description="Flexible fee structures, invoice generation, multiple payment modes, and comprehensive collection reports."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Examination System"
              description="Multiple exam types, flexible grading, automated report card generation, and performance analytics."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Enterprise Security"
              description="Data encryption, role-based access control, audit logs, and automated daily backups."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="WhatsApp Integration"
              description="Bulk messaging, template management, group communication, and automated notifications."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-950/50 to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for Every
              <span className="bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent"> Stakeholder</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BenefitCard
              title="For Administrators"
              benefits={[
                "Reduce paperwork by 80%",
                "Centralized data management",
                "Instant report generation",
                "Data-driven decisions"
              ]}
            />
            <BenefitCard
              title="For Teachers"
              benefits={[
                "Easy attendance marking",
                "Quick grade entry",
                "Performance tracking",
                "Reduced admin burden"
              ]}
            />
            <BenefitCard
              title="For Parents"
              benefits={[
                "Real-time progress access",
                "Fee payment tracking",
                "Attendance notifications",
                "Direct school communication"
              ]}
            />
            <BenefitCard
              title="For Accountants"
              benefits={[
                "Streamlined fee collection",
                "Automated invoicing",
                "Comprehensive reports",
                "Error-free calculations"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose
                <span className="bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent"> Shiksha?</span>
              </h2>
              <div className="space-y-6">
                <WhyCard
                  icon={<Cloud className="h-6 w-6" />}
                  title="Cloud-Based"
                  description="Access from anywhere, anytime on any device"
                />
                <WhyCard
                  icon={<Zap className="h-6 w-6" />}
                  title="Real-time Updates"
                  description="Instant data synchronization across all modules"
                />
                <WhyCard
                  icon={<Smartphone className="h-6 w-6" />}
                  title="Mobile Responsive"
                  description="Works seamlessly on all devices and screen sizes"
                />
                <WhyCard
                  icon={<Shield className="h-6 w-6" />}
                  title="Enterprise Security"
                  description="Bank-grade security with Supabase and encryption"
                />
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-900/30 to-orange-900/30 rounded-2xl p-8 border border-orange-500/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-orange-500/20">
                    <span className="text-gray-300">Total Students</span>
                    <span className="text-2xl font-bold text-orange-400">2,847</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-orange-500/20">
                    <span className="text-gray-300">Active Teachers</span>
                    <span className="text-2xl font-bold text-orange-400">156</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-orange-500/20">
                    <span className="text-gray-300">Monthly Collection</span>
                    <span className="text-2xl font-bold text-green-400">₹12.5L</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-orange-500/20">
                    <span className="text-gray-300">Attendance Today</span>
                    <span className="text-2xl font-bold text-blue-400">94.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-orange-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent
              <span className="bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-400">Pay per student, billed annually</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 border border-orange-900/30 hover:border-orange-500/50 transition-all">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-400 mb-6">Best for small schools</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹50</span>
                <span className="text-gray-400">/student/year</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Up to 300 students</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">All core modules</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">5 admin users</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Email support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Monthly backups</span>
                </li>
              </ul>
              <a
                href="https://orchidsw.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 border border-orange-500/50 rounded-lg font-semibold hover:bg-orange-900/30 transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Professional Plan */}
            <div className="bg-gradient-to-b from-orange-900/30 to-slate-950 rounded-2xl p-8 border-2 border-orange-500 hover:border-orange-400 transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-orange-500 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-400 mb-6">Best for medium schools</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹100</span>
                <span className="text-gray-400">/student/year</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Up to 1000 students</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">All Starter features</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">15 admin users</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">WhatsApp integration</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Priority support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Weekly backups</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Custom reports</span>
                </li>
              </ul>
              <a
                href="https://orchidsw.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-500 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-600 transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 border border-orange-900/30 hover:border-orange-500/50 transition-all">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-400 mb-6">Best for large institutions</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">1000+ students</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">All Professional features</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Unlimited admin users</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Dedicated support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Custom development</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Daily backups</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">API access</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Multi-branch support</span>
                </li>
              </ul>
              <a
                href="https://orchidsw.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 border border-orange-500/50 rounded-lg font-semibold hover:bg-orange-900/30 transition-all"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by
              <span className="bg-gradient-to-r from-orange-400 to-orange-400 bg-clip-text text-transparent"> Leading Schools</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Shiksha has transformed how we manage our school. The fee collection module alone has saved us countless hours."
              author="Principal, Aurora Public School"
            />
            <TestimonialCard
              quote="The attendance tracking and parent communication features have improved our engagement significantly."
              author="Administrator, Manas International Public School"
            />
            <TestimonialCard
              quote="Easy to use, comprehensive features, and excellent support. Highly recommended!"
              author="Director, St. Andrews Academy"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-900/30 to-orange-900/30 border-t border-orange-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of schools already using Shiksha to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="#pricing"
              className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-500 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-600 transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://orchidsw.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-orange-500/50 rounded-lg font-semibold text-lg hover:bg-orange-900/30 transition-all"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-orange-500/30 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/orhcid_logo_black_font.svg"
                  alt="Orchid Software"
                  width={120}
                  height={35}
                  className="brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm">
                Empowering Education Through Technology
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-orange-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-orange-400 transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://orchidsw.com/about-us" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="https://orchidsw.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">Contact</a></li>
                <li><a href="https://orchidsw.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>info@orchidsw.com</li>
                <li>+91 9079003238</li>
                <li>Orchid Software</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t-2 border-orange-500/20 text-center text-gray-400 text-sm">
            <p>© 2026 Orchid Software. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Component: Feature Card
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-gradient-to-b from-slate-900/50 to-slate-950/50 rounded-xl p-6 border border-orange-900/30 hover:border-orange-500/50 transition-all group">
      <div className="text-orange-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

// Component: Benefit Card
function BenefitCard({ title, benefits }: { title: string, benefits: string[] }) {
  return (
    <div className="bg-gradient-to-b from-slate-900/50 to-slate-950/50 rounded-xl p-6 border border-orange-900/30">
      <h3 className="text-xl font-semibold mb-4 text-orange-400">{title}</h3>
      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300 text-sm">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Component: Why Card
function WhyCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 border border-orange-500/30">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  )
}

// Component: Testimonial Card
function TestimonialCard({ quote, author }: { quote: string, author: string }) {
  return (
    <div className="bg-gradient-to-b from-slate-900/50 to-slate-950/50 rounded-xl p-6 border border-orange-900/30">
      <div className="text-orange-400 text-4xl mb-4">"</div>
      <p className="text-gray-300 mb-4">{quote}</p>
      <p className="text-gray-400 text-sm font-semibold">— {author}</p>
    </div>
  )
}
