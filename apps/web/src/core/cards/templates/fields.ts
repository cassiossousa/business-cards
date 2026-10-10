import type { CardFieldDefinition } from "../cardTypes";

export const CARD_FONT_FAMILY = "Inter, system-ui, sans-serif";

export const COMMON_CARD_FIELDS: readonly CardFieldDefinition[] = [
  {
    key: "fullName",
    label: "Name",
    inputType: "text",
    placeholder: "Alex Morgan",
    initialValue: "Alex Morgan",
    autocomplete: "name",
  },
  {
    key: "role",
    label: "Role or title",
    inputType: "text",
    placeholder: "Creative Developer",
    initialValue: "Creative Developer",
    autocomplete: "organization-title",
  },
  {
    key: "email",
    label: "Email",
    inputType: "email",
    placeholder: "alex@example.com",
    initialValue: "alex@example.com",
    autocomplete: "email",
  },
  {
    key: "phone",
    label: "Phone",
    inputType: "tel",
    placeholder: "+55 11 99999-0000",
    initialValue: "+55 11 99999-0000",
    autocomplete: "tel",
  },
  {
    key: "website",
    label: "Website",
    inputType: "text",
    placeholder: "example.com",
    initialValue: "example.com",
    autocomplete: "url",
  },
];
