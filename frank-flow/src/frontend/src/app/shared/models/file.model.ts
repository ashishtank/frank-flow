import { FileType } from '../enums/file-type.enum';
import { FlowStructure } from './flow-structure.model';

export interface File {
  path: string;
  configuration: string;
  xml?: string;
  flowStructure?: FlowStructure;
  errors?: string[];
  saved?: boolean;
  flowNeedsUpdate?: boolean;
  type: FileType;
  firstLoad?: boolean;
}
