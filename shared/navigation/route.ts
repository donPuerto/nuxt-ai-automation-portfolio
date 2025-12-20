export interface Route {
  name: string
  path: string
}

export const routes: Route[] = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Testimonials', path: '/testimonials' },
  { name: 'Contact', path: '/contact' },
  { name: 'About', path: '/about' },
]