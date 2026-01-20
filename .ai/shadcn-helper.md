# Shadcn UI Components

This project uses **@shadcn/ui** for user interface components. These are beautifully designed, accessible components that can be customized to fit your application.

## Locating installed components

Components are available in the `src/components/ui` folder, according to the aliases defined in the `components.json` file.

## Using components

Import components using the configured `@/` alias:

```tsx
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
```

Example usage of components:

```tsx
<Button variant="outline">Click me</Button>

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
```

## Installing additional components

Many other components are available but are not currently installed. A full list can be found at:
[https://ui.shadcn.com/r](https://ui.shadcn.com/r)

To install a new component, use the shadcn CLI:

```bash
npx shadcn@latest add [component-name]
```

For example, to add the accordion component:

```bash
npx shadcn@latest add accordion
```

**Important:** `npx shadcn-ui@latest` has been deprecated; use `npx shadcn@latest` instead.

Some popular components include:

* Accordion
* Alert
* AlertDialog
* AspectRatio
* Avatar
* Calendar
* Checkbox
* Collapsible
* Command
* ContextMenu
* DataTable
* DatePicker
* Dropdown Menu
* Form
* Hover Card
* Menubar
* Navigation Menu
* Popover
* Progress
* Radio Group
* ScrollArea
* Select
* Separator
* Sheet
* Skeleton
* Slider
* Switch
* Table
* Textarea
* Sonner (formerly Toast)
* Toggle
* Tooltip

## Component styling

This project uses the **“new-york”** style variant with the base color set to **“neutral”**, along with CSS variables for theming, as configured in the `components.json` section.
