/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface ISeason {
  id: number;
  changedBy: string;
  changedAt: string;
  data_enc: string;
  data: {
    dates: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^[0-9]{4}-[0-9]{2}-[0-9]{2}$".
       */
      [k: string]: {
        desc: string;
        training: boolean;
      };
    };
  };
  begin: string;
  begin2: string;
  end: string;
  name: string;
}