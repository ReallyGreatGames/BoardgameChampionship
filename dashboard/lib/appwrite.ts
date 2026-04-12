import { Client } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.trim())
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!.trim());

export { client };
