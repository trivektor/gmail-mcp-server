import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import server from "./server.js";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import open from "open";
import http from "http";
import destroyer from "server-destroy";
import url from "url";

let oAuth2Client;

async function main() {
  const transport = new StdioServerTransport();

  const credentialsFileContent = fs.readFileSync("./oauth2.keys.json", "utf-8");
  const credentials = JSON.parse(credentialsFileContent);

  oAuth2Client = new OAuth2Client(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  try {
    const tokenPath = './token.json';
    const tokenFileContent = await fs.readFileSync(tokenPath);
    const token = JSON.parse(tokenFileContent);
    
    oAuth2Client.setCredentials(token);
  } catch (error) {
    console.error(error);
    await authenticate();
  }

  try {
    // Then connect the server
    await server.connect(transport);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

async function authenticate() {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/userinfo.profile',
  });

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        // acquire the code from the querystring, and close the web server.
        const qs = new url.URL(req.url, 'http://localhost:3000')
          .searchParams;
        const code = qs.get('code');
        console.log(`Code is ${code}`);
        res.end('Authentication successful! Please return to the console.');
        server.destroy();

        // Now that we have the code, use that to acquire tokens.
        const response = await oAuth2Client.getToken(code);
        // Make sure to set the credentials on the OAuth2 client.
        oAuth2Client.setCredentials(response.tokens);

        fs.writeFileSync('./token.json', JSON.stringify(response.tokens));

        console.info('Tokens acquired.');
      }
    } catch (e) {
      console.error(e);
    }
  })
  .listen(3000, () => {
    // open the browser to the authorize url to start the workflow
    open(authorizeUrl, {wait: false}).then(cp => cp.unref());
  });

  destroyer(server);
}

main();