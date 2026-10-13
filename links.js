// This is the starting list of UH links that shows up the first time the extension is opened.
// The user can add, remove, pin, and reorder them, and "Reset to defaults" brings this list back.
// Each link has an id, a title, a url, tags (extra search words), and if it starts pinned.
export const DEFAULT_LINKS = [
  { id: "accessuh",   title: "AccessUH",               url: "https://accessuh.uh.edu/",              tags: "portal login myuh peoplesoft enroll registration sso", pinned: true },
  { id: "canvas",     title: "Canvas",                 url: "https://canvas.uh.edu/",                tags: "courses classes lms assignments grades homework",      pinned: true },
  { id: "outlook",    title: "CougarNet Email",        url: "https://outlook.office.com/mail/",      tags: "email mail outlook office 365 microsoft",              pinned: true },
  { id: "navigate",   title: "Navigate (Advising)",    url: "https://uh.navigate.eab.com/",          tags: "advisor advising appointment schedule degree",         pinned: false },
  { id: "registrar",  title: "Registrar",              url: "https://www.uh.edu/registrar/",         tags: "academic calendar transcript registration deadlines",  pinned: false },
  { id: "catalog",    title: "Course Catalog",         url: "https://publications.uh.edu/",          tags: "catalog courses degree requirements undergraduate",    pinned: false },
  { id: "finaid",     title: "Financial Aid",          url: "https://www.uh.edu/financial/",         tags: "fafsa scholarships aid money grants loans",            pinned: false },
  { id: "sbs",        title: "Student Business Services", url: "https://www.uh.edu/sbs/",           tags: "tuition billing payment fees refund",                  pinned: false },
  { id: "library",    title: "UH Libraries",           url: "https://libraries.uh.edu/",             tags: "library books research databases study rooms",        pinned: false },
  { id: "handshake",  title: "Handshake",              url: "https://uh.joinhandshake.com/",         tags: "jobs internships career fair recruiting",              pinned: false },
  { id: "engage",     title: "Get Involved (Engage)",  url: "https://uh.campuslabs.com/engage/",     tags: "orgs organizations clubs events student life",         pinned: false },
  { id: "cs",         title: "Computer Science Dept.", url: "https://uh.edu/nsm/computer-science/",  tags: "cosc cs department nsm faculty",                       pinned: false },
  { id: "parking",    title: "Parking",                url: "https://www.uh.edu/parking/",           tags: "permit parking transportation shuttle",                pinned: false },
  { id: "rec",        title: "Campus Recreation",      url: "https://www.uh.edu/recreation/",        tags: "gym rec center fitness intramurals",                   pinned: false },
  { id: "uh",         title: "UH Homepage",            url: "https://www.uh.edu/",                   tags: "university of houston home main",                      pinned: false }
];
