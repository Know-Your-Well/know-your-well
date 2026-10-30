// const { DefaultAzureCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");

export default async function uploadPhoto(file, containerName, blobName, metadata) {
  try {
    const AZURE_STORAGE_CONNECTION_STRING =
        "BlobEndpoint=https://knowyourwell.blob.core.windows.net/;\
        QueueEndpoint=https://knowyourwell.queue.core.windows.net/;\
        FileEndpoint=https://knowyourwell.file.core.windows.net/;\
        TableEndpoint=https://knowyourwell.table.core.windows.net/;\
        SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwlactfx&se=2999-12-31T18:59:59Z&st=2024-11-07T20:20:40Z&spr=https&sig=QbowwqDo0yTELgGEKK8XhkNmfI3FSBUnBrMUY8evsSM%3D";
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      throw Error("Azure Storage Connection string not found");
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists().catch((error) => {
      if (error.statusCode !== 409) {
        console.error(error);
      }
    });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const blobHTTPHeaders = {
      blobContentType: file.type,
      blobContentDisposition: `inline; filename="${blobName}"`,
    }; 

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: blobHTTPHeaders,
      metadata: metadata,
    });
  } catch (err) {
    console.log(`knowyourwell/knowyourwell/ClientApp/src/components/reusable/photoUpload.js --> uploadPhoto --> Error: ${err.message}`);
    throw err;
  }
}
