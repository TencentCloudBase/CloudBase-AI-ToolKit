import CloudBase from "@cloudbase/manager-node";

export interface UploadFileParams {
  cloudPath: string;
  fileContent: string;
}

export interface ListFilesParams {
  prefix: string;
  marker?: string;
}

export interface DeleteFileParams {
  cloudPath: string;
}

export interface GetFileInfoParams {
  cloudPath: string;
}

export interface ToolResponse {
  success: boolean;
  [key: string]: any;
}

// 数据模型相关类型定义
export interface DataModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'objectId' | 'file' | 'image';
  required?: boolean;
  default?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface DataModelSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
    default?: any;
    validation?: any;
  }>;
  required?: string[];
}

export interface DataModel {
  id?: string;
  name: string;
  title: string;
  schema: DataModelSchema;
  envId?: string;
  status?: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}

// CloudBase 配置选项
export type CloudBaseOptions = NonNullable<ConstructorParameters<typeof CloudBase>[0]>

export type Logger = (data: {
  type: string;
  requestId?: string;
  result?: any;
  toolName?: string;
  args?: any;
  message?: string;
  duration?: number;
  [key: string]: any;
}) => void;