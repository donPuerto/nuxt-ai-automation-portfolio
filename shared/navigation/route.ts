export interface Route {
  name: string
  path: string
}

export const routes: Route[] = [
  { name: 'Home', path: '/' },
  { name: 'Projects', path: '/projects' },
  { name: 'Contact', path: '/contact' },
  { name: 'About', path: '/about' },
]
