/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prettier/prettier */

import { getHours } from "date-fns";

// Função interna que escapa caracteres HTML especiais
const _htmlEscape = string =>
  string
    .replace(/&/g, "&amp;") 
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Função interna que desfaz o escape de caracteres HTML
const _htmlUnescape = (htmlString: string) =>
  htmlString
    .replace(/>/g, ">") 
    .replace(/</g, "<") 
    .replace(/&#0?39;/g, "'")
    .replace(/"/g, '"') 
    .replace(/&amp;/g, "&");

// Função para escapar strings HTML com suporte a template literals
export function htmlEscape(strings: TemplateStringsArray, ...values: any[]) {
  if (typeof strings === "string") {
    return _htmlEscape(strings);
  }

  let output = strings[0];
  for (const [index, value] of values.entries()) {
    output = output + _htmlEscape(String(value)) + strings[index + 1];
  }

  return output;
}

// Função para desfazer o escape de strings HTML com suporte a template literals
export function htmlUnescape(strings: TemplateStringsArray, ...values: any[]) {
  if (typeof strings === "string") {
    return _htmlUnescape(strings);
  }

  let output = strings[0];
  for (const [index, value] of values.entries()) {
    output = output + _htmlUnescape(String(value)) + strings[index + 1];
  }

  return output;
}

// Classe de erro personalizada para valores ausentes em templates
export class MissingValueError extends Error {
  key: any;

  constructor(key: any) {
    super(
      `Missing a value for ${key ? `the placeholder: ${key}` : "a placeholder"}`
    );
    this.name = "MissingValueError";
    this.key = key;
  }
}

// Função principal que processa templates com placeholders
export const pupa = function pupa(
  template: string,
  data: object,
  { ignoreMissing = true, transform = (value: any) => value } = {}
) {
  if (typeof template !== "string") {
    throw new TypeError(
      `Expected a \`string\` in the first argument, got \`${typeof template}\``
    );
  }

  if (typeof data !== "object") {
    throw new TypeError(
      `Expected an \`object\` or \`Array\` in the second argument, got \`${typeof data}\``
    );
  }

  const hours = getHours(new Date()); // Obtém a hora atual
  const getGreeting = () => {
    if (hours >= 6 && hours <= 11) {
      return "Bom dia!";
    }
    if (hours > 11 && hours <= 17) {
      return "Boa Tarde!";
    }
    if (hours > 17 && hours <= 23) {
      return "Boa Noite!";
    }
    return "Olá!";
  };

  // Função de despedida/agradecimento com base na hora
  const getFarewell = (hours) => {
    if (hours >= 6 && hours <= 11) {
      return "Obrigado, tenha um excelente dia!";
    }
    if (hours > 11 && hours <= 17) {
      return "Obrigado, boa tarde!";
    }
    if (hours > 17 && hours <= 23) {
      return "Obrigado, boa noite!";
    }
    return "Obrigado!";
  };

  data = { ...data, greeting: getGreeting(), farewell: getFarewell(hours) }; // Adiciona saudação e despedida aos dados

  const replace = (placeholder: string, key: string) => {
    let value = data;
    for (const property of key.split(".")) {
      value = value ? value[property] : undefined;
    }

    const transformedValue = transform(value);
    if (transformedValue === undefined) {
      if (ignoreMissing) {
        return "";
      }

      throw new MissingValueError(key);
    }

    return String(transformedValue);
  };

  const composeHtmlEscape =
    replacer =>
      (...args: any) =>
        htmlEscape(replacer(...args));

  const doubleBraceRegex = /{{(\d+|[a-z$_][\w\-$]*?(?:\.[\w\-$]*?)*?)}}/gi;

  if (doubleBraceRegex.test(template)) {
    template = template.replace(doubleBraceRegex, composeHtmlEscape(replace));
  }

  const braceRegex = /{(\d+|[a-z$_][\w\-$]*?(?:\.[\w\-$]*?)*?)}/gi;

  return template.replace(braceRegex, replace);
};
