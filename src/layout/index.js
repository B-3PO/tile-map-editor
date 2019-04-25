const { html } = require('@webformula/pax-core');

module.exports = ({ head, body, title }) => html`
  <!doctype html>
  <html lang="en">
    <head>
      <title>${title}</title>

      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

      <link rel="stylesheet" href="main.css">
      ${head}
    </head>

    <body>
      ${body}
    </body>
  </html>
`;
