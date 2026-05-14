import { Page } from "playwright";

export interface Button {
  text: string;
  ariaLabel?: string;
  role?: string;
  id?: string;
  class?: string;
  disabled: boolean;
  type?: string;
}

export async function extractButtons(page: Page): Promise<Button[]> {
  return page.evaluate(() => {
    const buttons: Button[] = [];
    const buttonElements = document.querySelectorAll("button, [role='button']");

    buttonElements.forEach((el) => {
      const button: Button = {
        text: el.textContent?.trim() || "",
        ariaLabel: el.getAttribute("aria-label") || undefined,
        role: el.getAttribute("role") || undefined,
        id: el.id || undefined,
        class: el.className || undefined,
        disabled: (el as HTMLButtonElement).disabled || false,
        type: (el as HTMLButtonElement).type || undefined,
      };

      if (button.text || button.ariaLabel) {
        buttons.push(button);
      }
    });

    return buttons;
  });
}
