import { Page } from "playwright";

export interface FormField {
  name?: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface Form {
  action?: string;
  method: string;
  id?: string;
  fieldCount: number;
  fields: FormField[];
}

export async function extractForms(page: Page): Promise<Form[]> {
  return page.evaluate(() => {
    const forms: Form[] = [];
    const formElements = document.querySelectorAll("form");

    formElements.forEach((formEl) => {
      const fields: FormField[] = [];
      const inputs = formEl.querySelectorAll("input, textarea, select");

      inputs.forEach((input) => {
        const field: FormField = {
          name: input.getAttribute("name") || undefined,
          type: input.getAttribute("type") || input.tagName.toLowerCase(),
          required: input.hasAttribute("required"),
          placeholder: input.getAttribute("placeholder") || undefined,
        };
        fields.push(field);
      });

      const form: Form = {
        action: formEl.getAttribute("action") || undefined,
        method: formEl.getAttribute("method") || "GET",
        id: formEl.id || undefined,
        fieldCount: fields.length,
        fields,
      };

      forms.push(form);
    });

    return forms;
  });
}
