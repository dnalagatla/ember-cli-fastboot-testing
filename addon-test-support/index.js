import fetch from 'fetch';
import { setupContext, teardownContext } from '@ember/test-helpers';
import param from 'jquery-param';
import { htmlCompare } from './-private/validate-html';

export function setup(hooks) {
  hooks.beforeEach(function() {
    return setupContext(this);
  });

  hooks.afterEach(function() {
    return teardownContext(this);
  });
}

export async function fastboot(url, { headers = {} }) {
  let endpoint = `/__fastboot-testing?${param({url, headers})}`;
  let response = await fetch(endpoint);
  let result = await response.json();

  let body = extractBody(result.html);

  result.body = body;
  result.htmlDocument = parseHtml(result.html)

  return result;
}

export async function visit(url, options = {}) {
  let result = await fastboot(url, { headers: options.headers || {} });
  let renderTo = document.querySelector('#ember-testing');

  renderTo.innerHTML = result.body;

  // the browser will auto correct any html once we render it.
  // so we can now compare our element's innerHTML to the result
  // form fastboot. if they differ, we know that fastboot isn't
  // rendering valid html.
  result.isValidHtml = htmlCompare(renderTo.innerHTML, result.body);

  return result;
}

export function renderedHtml() {
  return document.querySelector('#ember-testing').innerHTML;
}

export function parseHtml(str) {
  let parser = new DOMParser();
  return parser.parseFromString(str, "text/html");
}

export function extractBody(html) {
  let start = '<script type="x/boundary" id="fastboot-body-start"></script>';
  let end = '<script type="x/boundary" id="fastboot-body-end"></script>';

  let startPosition = html.indexOf(start);
  let endPosition = html.indexOf(end);

  if (!startPosition || !endPosition) {
    throw "Could not find fastboot boundary";
  }

  let startAt = startPosition + start.length;
  let endAt = endPosition - startAt;

  return html.substr(startAt, endAt);
}
