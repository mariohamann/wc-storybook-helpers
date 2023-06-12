import { TemplateResult } from "lit";
import { ArgTypes } from "./storybook";
import { getStyleTemplate, getTemplate } from "./html-templates.js";
import {
  getComponentByTagName,
  getCssParts,
  getCssProperties,
  getAttributesAndProperties,
  getReactEvents,
  getReactProperties,
  getSlots,
} from "./cem-utilities.js";
import { Declaration } from "./cem-schema";

/**
 * Gets Storybook helpers for a given component
 * @param tagName the tag name referenced in the Custom Elements Manifest
 * @returns An object containing the argTypes, reactArgTypes, events, styleTemplate, and template
 */
export function getWcStorybookHelpers(tagName: string, options?: {
  showArgRef?: boolean;
}) {
  /**
   *
   * uses the global window.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__
   * variable created by the Storybook `setCustomElementsManifest`
   * method in the `preview.cjs` file
   *
   */
  const cem = (window as any).__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__;
  if (!cem) {
    throw new Error(
      "Custom Elements Manifest not found. Be sure to follow the pre-install steps in this guide:\nhttps://www.npmjs.com/package/wc-storybook-helpers#before-you-install"
    );
  }

  const component = getComponentByTagName(tagName, cem);
  const eventNames = component?.events?.map((event) => event.name) || [];

  return {
    argTypes: getArgTypes(component, { showArgRef: options?.showArgRef }),
    reactArgTypes: getReactProps(component),
    args: getArgs(component),
    events: eventNames,
    styleTemplate: (args?: any) => getStyleTemplate(component, args),
    template: (args?: any, slot?: TemplateResult) =>
      getTemplate(component, args, slot),
    manifest: component,
  };
}

function getArgTypes(component?: Declaration, options?: {
  showArgRef?: boolean;
}): ArgTypes {
  const argTypes: ArgTypes = {
    ...getAttributesAndProperties(component, { showArgRef: options?.showArgRef }),
    ...getSlots(component, { showArgRef: options?.showArgRef }),
    ...getCssProperties(component),
    ...getCssParts(component, { showArgRef: options?.showArgRef }),
  };

  return argTypes;
}

function getArgs(component?: Declaration): Record<string, any> {
  const args = Object.entries(getArgTypes(component))
    // We only want to get args that have a control in Storybook
    .filter(([, value]) => value?.control)
    .map(([key, value]) => ({ [key]: value.defaultValue || '' }))
    .reduce((acc, value) => ({ ...acc, ...value }), {});

  return args;
}

function getReactProps(component?: Declaration): ArgTypes {
  const argTypes: ArgTypes = {
    ...getReactProperties(component),
    ...getReactEvents(component),
  };

  return argTypes;
}
