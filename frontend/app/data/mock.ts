export type Role = "creator" | "business" | "admin";

export const creators = [
  { id: "ana-reyes", name: "Ana Reyes", handle: "@anaeatsph", city: "Quezon City", niches: ["Food", "Lifestyle"], followers: "128K", engagement: "5.8%", rate: "Paid + x-deal", available: "Open this week", bio: "Warm food and neighborhood stories for Filipino families.", portfolio: ["Jollibee review reel", "QC cafe crawl", "Holiday grocery haul"] },
  { id: "migz-travels", name: "Migz Santos", handle: "@migztravels", city: "Cebu", niches: ["Travel", "Hotels"], followers: "84K", engagement: "6.1%", rate: "Paid campaigns", available: "Weekends", bio: "Budget travel guides and honest staycation content.", portfolio: ["Cebu city guide", "Resort short-form set", "Airline promo vlog"] },
  { id: "bea-beauty", name: "Bea Lim", handle: "@beautybybea", city: "Makati", niches: ["Beauty", "Skincare"], followers: "212K", engagement: "4.9%", rate: "Paid only", available: "Booking for July", bio: "Practical skincare reviews for humid Philippine weather.", portfolio: ["Sunscreen test", "Clinic visit vlog", "GRWM livestream"] },
];

export const businesses = [
  { id: "sunrise-cafe", name: "Sunrise Cafe PH", city: "Cebu", industry: "Food & Beverage", verified: true, interests: ["Launches", "X-deals"], bio: "Neighborhood cafe group looking for authentic food content." },
  { id: "isla-stays", name: "Isla Stays", city: "Palawan", industry: "Hospitality", verified: true, interests: ["Travel campaigns", "Appointments"], bio: "Boutique stays for local and international travelers." },
  { id: "glow-local", name: "Glow Local", city: "Taguig", industry: "Beauty", verified: false, interests: ["Product seeding", "Paid campaigns"], bio: "Philippine-made personal care for daily routines." },
];

export const campaigns = [
  { title: "Cebu summer menu launch", business: "Sunrise Cafe PH", status: "Offer sent", budget: "₱18,000", deal: "Paid + meal x-deal", deliverables: ["1 Reel", "3 Stories", "Usage notes"], progress: 45 },
  { title: "Staycation creator weekend", business: "Isla Stays", status: "In progress", budget: "X-deal", deal: "2D1N stay + transport allowance", deliverables: ["1 vlog", "5 photos"], progress: 70 },
];

export const appointments = [
  { title: "Campaign briefing", with: "Ana Reyes", date: "Jun 24", time: "2:00 PM", status: "Accepted", channel: "Google Meet" },
  { title: "Rate card review", with: "Sunrise Cafe PH", date: "Jun 26", time: "10:30 AM", status: "Pending", channel: "Zoom" },
  { title: "Content review", with: "Isla Stays", date: "Jun 29", time: "4:00 PM", status: "Reschedule requested", channel: "In-app call" },
];

export const conversations = [
  { name: "Sunrise Cafe PH", preview: "Can we confirm deliverable dates?", unread: 2, safe: "Participant-only" },
  { name: "Ana Reyes", preview: "Thanks! Sending my media kit link.", unread: 0, safe: "RLS protected" },
  { name: "Collabify Support", preview: "Your business verification is under review.", unread: 1, safe: "Private" },
];

export const auditLogs = ["Business verification approved: Sunrise Cafe PH", "Report triaged: spam outreach", "Creator profile visibility updated", "Admin note added to Glow Local review"];
