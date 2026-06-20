import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("verify-email", "routes/verify-email.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("creator/dashboard", "routes/creator-dashboard.tsx"),
  route("business/dashboard", "routes/business-dashboard.tsx"),
  route("creators/:id", "routes/creator-profile.tsx"),
  route("businesses/:id", "routes/business-profile.tsx"),
  route("discover/creators", "routes/discover-creators.tsx"),
  route("discover/businesses", "routes/discover-businesses.tsx"),
  route("appointments", "routes/appointments.tsx"),
  route("messages", "routes/messages.tsx"),
  route("campaigns", "routes/campaigns.tsx"),
  route("settings", "routes/settings.tsx"),
  route("billing", "routes/billing.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
