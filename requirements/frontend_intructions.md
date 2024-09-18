# Current folder structure
.
├── .eslintrc.json
├── .gitignore
├── .nvmrc
├── README.md
├── drizzle.config.ts
├── next.config.mjs
├── package.json
├── postcss.config.js
├── prettier.config.js
├── tailwind.config.ts
├── tsconfig.json
├── requirements
│   └── frontend_intructions.md
├── scripts
│   └── seed.js
└── src
    ├── app
    │   ├── (dashboard)
    │   │   └── dashboard
    │   │       ├── interior
    │   │       │   ├── layout.tsx
    │   │       │   └── page.tsx
    │   │       └── invoices
    │   │           └── page.tsx
    │   ├── (marketing)
    │   │   └── page.tsx
    │   ├── api
    │   │   ├── gen
    │   │   │   └── route.ts
    │   │   └── uploadthing
    │   │       ├── core.ts
    │   │       └── route.ts
    │   ├── lib
    │   │   ├── data.ts
    │   │   ├── definitions.ts
    │   │   ├── placeholder-data.js
    │   │   └── utils.ts
    │   ├── server
    │   │   └── db
    │   │       ├── index.ts
    │   │       ├── migrations
    │   │       └── schema.ts
    │   └── ui
    │       ├── acme-logo.tsx
    │       ├── customers
    │       │   └── table.tsx
    │       ├── dashboard
    │       │   └── revenue-chart.tsx
    │       ├── fonts.ts
    │       ├── global.css
    │       ├── home.module.css
    │       ├── invoices
    │       │   └── table.tsx
    │       ├── login-form.tsx
    │       └── skeletons.tsx
    └── utils
        ├── dropdownTypes.ts
        └── uploadthing.ts

# Rules
- All new components should be added to the /components folder and be named like example-component.tsx unless otherwise specified
- All new pages should be added to the src/app/(dashboard|marketing) folder and be named like example-page.tsx unless otherwise specified
- Always use tailwind
- Always use zustand for state management
- Always use uploadthing for file upload
- Always use drizzle for database
- Always use clerk for authentication
