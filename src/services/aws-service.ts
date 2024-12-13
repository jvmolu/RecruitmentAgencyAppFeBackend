import { 
    S3, 
    S3ClientConfig,
    GetObjectCommand, 
    PutObjectCommandInput, 
    GetObjectCommandOutput, 
    ObjectCannedACL, 
    HeadObjectCommandOutput, 
    DeleteObjectCommandInput, 
    ListObjectsV2CommandInput, 
    ListObjectsV2CommandOutput
  } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  import { Readable } from 'stream';
  import dotenv from 'dotenv';
  import { GeneralAppResponse } from '../types/response/general-app-response';
  import HttpStatusCode from '../types/enums/http-status-codes';
  import { S3Error } from '../types/error/s3-error';
  
  dotenv.config({ path: __dirname + '/../../.env' });
  
  /**
   * @class S3Service
   * @description Class to interact with DigitalOcean Spaces
   */
  class S3Service {

    // Private S3 Client Instance
    private s3: S3;
    private static instance: S3Service;
  
    /**
     * @constructor
     * @description Initializes the S3 client
     */
    private constructor() {
      const accessKeyId = process.env.DIGITAL_OCEAN_ACCESS_KEY_ID;
      const secretAccessKey = process.env.DIGITAL_OCEAN_SECRET_ACCESS_KEY;
      const endpoint = process.env.DIGITAL_OCEAN_BUCKET_END_POINT;
      const region = process.env.DIGITAL_OCEAN_BUCKET_REGION;
  
      if (!accessKeyId || !secretAccessKey || !endpoint || !region) {
        throw new Error('Missing DigitalOcean S3 credentials or configuration.');
      }
  
      const s3Config: S3ClientConfig = {
        forcePathStyle: false,
        endpoint: endpoint,
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
      };
  
      this.s3 = new S3(s3Config);
    }

    public static getInstance(): S3Service {
        if (!S3Service.instance) {
            S3Service.instance = new S3Service();
        }
        return S3Service.instance;
    }
  
    /**
     * @method uploadFile
     * @description Uploads a file to DigitalOcean Spaces
     * @param bucketName - Name of the bucket
     * @param filePath - Full path (including file name) where the file will be saved in the bucket
     * @param fileContent - Content of the file as a Buffer
     * @returns Promise resolving to a GeneralAppResponse
     */
    public async uploadFile(bucketName: string, filePath: string, fileContent: Buffer): Promise<GeneralAppResponse<void>> {
      const params: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: filePath,
        Body: fileContent,
        ACL: ObjectCannedACL.private,
      };
      try {
        await this.s3.putObject(params);
        return { data: undefined, success: true };
      } catch (error: any) {
        console.error(error);
        const s3Error = new Error('Error uploading file') as S3Error;
        s3Error.errorType = 'S3Error';
        return {
          error: s3Error,
          businessMessage: 'Error uploading file',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
          success: false,
        };
      }
    }
  
    /**
     * @method downloadFile
     * @description Downloads a file from DigitalOcean Spaces
     * @param bucketName - Name of the bucket
     * @param filePath - Path of the file in the bucket
     * @returns Promise resolving to a GeneralAppResponse containing the file as a Buffer
     */
    public async downloadFile(bucketName: string, filePath: string): Promise<GeneralAppResponse<Buffer>> {
      const params = {
        Bucket: bucketName,
        Key: filePath,
      };
      try {
        const data: GetObjectCommandOutput = await this.s3.getObject(params);
        if (!data.Body) {
          const s3Error = new Error('No data returned from getObject') as S3Error;
          s3Error.errorType = 'S3Error';
          return {
            error: s3Error,
            businessMessage: 'File not found or empty',
            statusCode: HttpStatusCode.NOT_FOUND,
            success: false,
          };
        }
        const body = data.Body as Readable;
        const buffer = await this.streamToBuffer(body);
        return { data: buffer, success: true };
      } catch (error: any) {
        console.error(error);
        const s3Error = new Error('Error downloading file') as S3Error;
        s3Error.errorType = 'S3Error';
        return {
          error: s3Error,
          businessMessage: 'Error downloading file',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
          success: false,
        };
      }
    }
  
    /**
     * @method getCreatedAt
     * @description Retrieves the creation date of a file in DigitalOcean Spaces
     * @param bucketName - Name of the bucket
     * @param filePath - Path of the file
     * @returns Promise resolving to the creation date as a Date object or undefined
     */
    public async getCreatedAt(bucketName: string, filePath: string): Promise<Date | undefined> {
      const params = {
        Bucket: bucketName,
        Key: filePath,
      };
      try {
        const data: HeadObjectCommandOutput = await this.s3.headObject(params);
        return data.LastModified;
      } catch (error: any) {
        console.error(error);
        return undefined;
      }
    }
  
    /**
     * @method getPresignedUrl
     * @description Generates a presigned URL for a file in DigitalOcean Spaces
     * @param bucketName - Name of the bucket
     * @param filePath - Path of the file
     * @returns Promise resolving to the presigned URL as a string
     */
    public async getPresignedUrl(bucketName: string, filePath: string): Promise<string> {
      const params = {
        Bucket: bucketName,
        Key: filePath,
      };
      const command = new GetObjectCommand(params);
      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 * 24 * 7 });
      return url;
    }
  
    /**
     * @method deleteFile
     * @description Deletes a file from DigitalOcean Spaces
     * @param bucketName - Name of the bucket
     * @param filePath - Path of the file in the bucket
     * @returns Promise resolving to a GeneralAppResponse
     */
    public async deleteFile(bucketName: string, filePath: string): Promise<GeneralAppResponse<void>> {
      const params: DeleteObjectCommandInput = {
        Bucket: bucketName,
        Key: filePath,
      };
      try {
        await this.s3.deleteObject(params);
        return { data: undefined, success: true };
      } catch (error: any) {
        console.error(error);
        const s3Error = new Error('Error deleting file') as S3Error;
        s3Error.errorType = 'S3Error';
        return {
          error: s3Error,
          businessMessage: 'Error deleting file',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
          success: false,
        };
      }
    }
  
    /**
     * @method listFiles
     * @description Lists files in a bucket
     * @param bucketName - Name of the bucket
     * @param prefix - Prefix to filter the files
     * @returns Promise resolving to a GeneralAppResponse containing an array of file keys
     */
    public async listFiles(bucketName: string, prefix: string = ''): Promise<GeneralAppResponse<string[]>> {
      const params: ListObjectsV2CommandInput = {
        Bucket: bucketName,
        Prefix: prefix !== '' ? prefix : undefined,
      };
      try {
        const data: ListObjectsV2CommandOutput = await this.s3.listObjectsV2(params);
        if (!data.Contents) {
          return { data: [], success: true };
        }
        const files = data.Contents.map((file) => file.Key || '');
        return { data: files, success: true };
      } catch (error: any) {
        console.error(error);
        const s3Error = new Error('Error listing files') as S3Error;
        s3Error.errorType = 'S3Error';
        return {
          error: s3Error,
          businessMessage: 'Error listing files',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
          success: false,
        };
      }
    }
  
    /**
     * @method streamToBuffer
     * @description Converts a Readable stream to a Buffer
     * @param stream - Readable stream to convert
     * @returns Promise resolving to a Buffer
     */
    private streamToBuffer(stream: Readable): Promise<Buffer> {
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));
      });
    }
  }
  
  export default S3Service;