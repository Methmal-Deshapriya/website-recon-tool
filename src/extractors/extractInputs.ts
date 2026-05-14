import { Page } from "playwright";

export interface Input {
  name?: string;
  type: string;
  placeholder?: string;
  value?: string;
  required: boolean;
  disabled: boolean;
  id?: string;
}

export async function extractInputs(page: Page): Promise<Input[]> {
  return page.evaluate(() => {
    const inputs: Input[] = [];
    const inputElements = document.querySelectorAll("input");

    inputElements.forEach((el) => {
      const input: Input = {
        name: el.name || undefined,
        type: el.type || "text",
        placeholder: el.placeholder || undefined,
        value: el.value ? el.value.substring(0, 50) : undefined,
        required: el.required,
        disabled: el.disabled,
        id: el.id || undefined,
      };

      inputs.push(input);
    });

    return inputs;
  });
}
