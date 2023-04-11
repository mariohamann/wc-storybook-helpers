import { CustomElementsManifest, Declaration } from "./cem-schema";
import { ArgTypes, ControlOptions } from "./storybook";

export function getComponentByTagName(
  tagName: string,
  customElementsManifest: CustomElementsManifest
): Declaration | undefined {
  const module = (
    customElementsManifest as CustomElementsManifest
  ).modules?.find((m) => m.declarations?.some((d) => d.tagName === tagName));

  return module?.declarations.find(
    (x) => x.kind === "class" && x.tagName === tagName
  );
}

export function getAttributesAndProperties(component?: Declaration): ArgTypes {
  const properties: ArgTypes = {};

  component?.members?.forEach((member) => {
    if (member.kind !== "field") {
      return;
    }

    if (member.attribute) {
      properties[member.attribute] = {
        name: member.attribute,
        table: {
          disable: true,
        },
      };
    }

    properties[member.name] = {
      name: member.name,
      table: {
        disable: true,
      },
    };

    if (
      member.privacy === "private" ||
      member.privacy === "protected" ||
      member.static
    ) {
      return;
    }

    const propType = cleanUpType(member?.type?.text);
    const propName = member.attribute
      ? `${member.attribute}-attr`
      : `${member.name}-prop`;
    const defaultValue = removeQuoteWrappers(member.default);

    properties[propName] = {
      name: member.attribute || member.name,
      description: getDescription(
        member.description,
        propName,
        member.deprecated
      ),
      defaultValue: defaultValue === "''" ? "" : defaultValue,
      control: {
        type: getControl(propType),
      },
      table: {
        category: member.attribute ? "attributes" : "properties",
        defaultValue: {
          summary: defaultValue,
        },
        type: {
          summary: member?.type?.text,
        },
      },
    };

    const values = propType?.split("|");
    if (values && values?.length > 1) {
      properties[propName].options = values.map((x) => removeQuoteWrappers(x)!);
    }
  });

  return properties;
}

export function getReactProperties(component?: Declaration): ArgTypes {
  const properties: ArgTypes = {};

  component?.members?.forEach((member) => {
    if (member.kind !== "field") {
      return;
    }

    properties[member.name] = {
      name: member.name,
      table: {
        disable: true,
      },
    };

    if (
      member.privacy === "private" ||
      member.privacy === "protected" ||
      member.static
    ) {
      return;
    }

    const propType = cleanUpType(member?.type?.text);
    const propName = `${member.name}`;
    const defaultValue = removeQuoteWrappers(member.default);

    properties[propName] = {
      name: member.name,
      description: member.description,
      defaultValue:
        defaultValue === "false"
          ? false
          : defaultValue === "''"
            ? ""
            : defaultValue,
      control: {
        type: getControl(propType),
      },
      table: {
        category: "properties",
        defaultValue: {
          summary: defaultValue,
        },
        type: {
          summary: member?.type?.text,
        },
      },
    };

    const values = propType?.split("|");
    if (values && values?.length > 1) {
      properties[propName].options = values.map((x) => removeQuoteWrappers(x)!);
    }
  });

  return properties;
}

export function getReactEvents(component?: Declaration): ArgTypes {
  const events: ArgTypes = {};

  component?.events?.forEach((member) => {
    const eventName = getReactEventName(member.name);
    events[eventName] = {
      name: eventName,
      description: member.description,
      table: {
        category: "events",
      },
    };
  });

  return events;
}

export function getCssProperties(component?: Declaration): ArgTypes {
  const properties: ArgTypes = {};

  component?.cssProperties?.forEach((property) => {
    properties[property.name] = {
      name: property.name,
      description: property.description,
      defaultValue: property.default,
      control: {
        type: "text",
      },
    };
  });

  return properties;
}

export function getCssParts(component?: Declaration): ArgTypes {
  const parts: ArgTypes = {};

  component?.cssParts?.forEach((part) => {
    parts[part.name] = {
      name: part.name,
      table: {
        disable: true,
      },
    };

    parts[`${part.name}-part`] = {
      name: part.name,
      description: getDescription(part.description, `${part.name}-part`),
      control: "text",
      defaultValue: `${component?.tagName}::part(${part.name}) {
}`,
      table: {
        category: "css shadow parts",
      },
    };
  });

  return parts;
}

export function getSlots(component?: Declaration): ArgTypes {
  const slots: ArgTypes = {};

  component?.slots?.forEach((slot) => {
    slots[slot.name] = {
      name: slot.name,
      table: {
        disable: true,
      },
    };

    const slotName = slot.name || "default";
    slots[`${slotName}-slot`] = {
      name: slotName,
      description: getDescription(slot.description, `${slotName}-slot`),
      control: "text",
      defaultValue: slotName === "default"
        ? ''
        : `<span slot="${slotName}"></span>`,
      table: {
        category: "slots",
      },
    };
  });

  return slots;
}

function getControl(type?: string): ControlOptions {
  if (!type) {
    return "text";
  }

  if (type.includes("boolean")) {
    return "boolean";
  }

  if (type.includes("number") && !type.includes("string")) {
    return "number";
  }

  if (type.includes("Date")) {
    return "date";
  }

  const values = type.split("|");
  if (values.length > 1) {
    if (values.length < 3) {
      return "inline-radio";
    }

    return values.length <= 4 ? "radio" : "select";
  }

  return "text";
}

function cleanUpType(type?: string): string {
  return !type ? "" : type.replace(" | undefined", "").replace(" | null", "");
}

function removeQuoteWrappers(value?: string) {
  return value?.trim().replace(/^["'](.+(?=["']$))["']$/, "$1");
}

function getDescription(
  description?: string,
  argRef?: string,
  deprecated?: string
) {
  let desc = "";
  if (deprecated) {
    desc += `\`@deprecated\` ${deprecated}\n\n\n`;
  }

  if (description) {
    desc += `${description}\n\n`;
  }

  return (desc += `arg ref - \`${argRef}\``);
}

export const getReactEventName = (eventName: string) =>
  `on${capitalizeFirstLetter(toCamelCase(eventName))}`;

function toCamelCase(value: string = "") {
  const arr = value.split("-");
  const capital = arr.map((item, index) =>
    index
      ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()
      : item.toLowerCase()
  );
  return capital.join("");
}

function capitalizeFirstLetter(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
