export interface Route {
  name: string
  path: string
}

export const routes: Route[] = [
  { name: 'Home', path: '/' },
  { name: 'Systems', path: '/systems' },
  { name: 'Contact', path: '/contact' },
  { name: 'About', path: '/about' },
]
