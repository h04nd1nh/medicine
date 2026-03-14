export default defineNuxtRouteMiddleware((to) => {
  const tokenCookie = useCookie('auth_token')

  const publicRoutes = ['/login']

  if (publicRoutes.includes(to.path)) {
    return
  }

  if (!tokenCookie.value) {
    return navigateTo('/login')
  }
})
