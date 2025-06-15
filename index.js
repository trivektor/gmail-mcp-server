import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import server from "./server.js";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import readline from "readline";

let oAuth2Client;

async function main() {
  const transport = new StdioServerTransport();

  const credentialsFileContent = fs.readFileSync("./oauth2.keys.json", "utf-8");
  const credentials = await JSON.parse(credentialsFileContent);

  console.log({credentials});

  oAuth2Client = new OAuth2Client(
    credentials.client_id,
    credentials.client_secret,
    "urn:ietf:wg:oauth:2.0:oob"
  );

  try {
    const tokenPath = './token.json';
    const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
    
    oAuth2Client.setCredentials(token);
  } catch (error) {
    console.error('No saved token found. You need to authenticate first.');
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
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/userinfo.profile',
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  console.log('Enter the code from that page here:');
  const code = await getAuthCode();
    
  const { tokens } = await oAuth2Client.getToken(code);
  
  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync('./token.json', JSON.stringify(tokens));
}

async function getAuthCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter the authorization code: ', (code) => {
      rl.close();
      resolve(code.trim());
    });
  });
}

main();