export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    // Inject critical CSS and theme initialization inline in the head
    const criticalCSS = `
      <style id="critical-css">
        html,body{visibility:visible!important;font-family:system-ui,-apple-system,Arial,sans-serif;margin:0;padding:0;}
        *{box-sizing:border-box;}
        
        /* Default theme colors inline to prevent FOUC */
        html.theme-default .theme-container,
        html.theme-default [data-reka-popper-content-wrapper] {
          --background: oklch(1 0 0);
          --foreground: oklch(0.1450 0 0);
          --card: oklch(1 0 0);
          --card-foreground: oklch(0.1450 0 0);
          --popover: oklch(1 0 0);
          --popover-foreground: oklch(0.1450 0 0);
          --primary: oklch(0.2050 0 0);
          --primary-foreground: oklch(0.9850 0 0);
          --secondary: oklch(0.9700 0 0);
          --secondary-foreground: oklch(0.2050 0 0);
          --muted: oklch(0.9700 0 0);
          --muted-foreground: oklch(0.5560 0 0);
          --accent: oklch(0.9700 0 0);
          --accent-foreground: oklch(0.2050 0 0);
          --border: oklch(0.9220 0 0);
          --input: oklch(0.9220 0 0);
          --ring: oklch(0.7080 0 0);
        }
        
        /* Dark mode colors */
        html.dark.theme-default .theme-container,
        html.dark.theme-default [data-reka-popper-content-wrapper] {
          --background: oklch(0.1450 0 0);
          --foreground: oklch(0.9850 0 0);
          --card: oklch(0.1450 0 0);
          --card-foreground: oklch(0.9850 0 0);
          --popover: oklch(0.1450 0 0);
          --popover-foreground: oklch(0.9850 0 0);
          --primary: oklch(0.9850 0 0);
          --primary-foreground: oklch(0.2050 0 0);
          --secondary: oklch(0.2700 0 0);
          --secondary-foreground: oklch(0.9850 0 0);
          --muted: oklch(0.2700 0 0);
          --muted-foreground: oklch(0.6370 0 0);
          --accent: oklch(0.2700 0 0);
          --accent-foreground: oklch(0.9850 0 0);
          --border: oklch(0.2700 0 0);
          --input: oklch(0.2700 0 0);
          --ring: oklch(0.8320 0 0);
        }
        
        body{background-color:hsl(var(--background,0 0% 100%));color:hsl(var(--foreground,0 0% 3.9%));}
      </style>
      <script>
        (function(){
          var html=document.documentElement;
          var theme=sessionStorage.getItem('selected-theme')||'default';
          var color=sessionStorage.getItem('selected-color')||'blue';
          var mode=sessionStorage.getItem('nuxt-color-mode')||'system';
          
          // Apply theme class immediately
          html.classList.add('theme-'+theme);
          html.classList.add('theme-'+color);
          
          // Apply dark mode class immediately if needed
          if(mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){
            html.classList.add('dark');
          }
        })();
      </script>
    `
    
    // Insert critical CSS and script at the beginning of head
    html.head.unshift(criticalCSS)
  })
})
