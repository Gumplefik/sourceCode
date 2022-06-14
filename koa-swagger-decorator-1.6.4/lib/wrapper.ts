import R from 'ramda';
import is from 'is-type-of';
import { swaggerHTML } from './swaggerHTML';
import { swaggerJSON } from './swaggerJSON';
import swaggerObject from './swaggerObject';
import {
  convertPath,
  getPath,
  loadSwaggerClasses,
  reservedMethodNames,
  allowedMethods
} from './utils';
import { Data } from './types';


export interface SwaggerDisplayConfiguration {
  deepLinking?: boolean;
  displayOperationId?: boolean;
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  defaultModelRendering?: 'example' | 'model';
  displayRequestDuration?: boolean;
  docExpansion?: 'list' | 'full' | 'none';
  filter?: boolean | string;
  maxDisplayedTags?: number;
  showExtensions?: boolean;
  showCommonExtensions?: boolean;
}

export interface SwaggerConfiguration {
  display?: SwaggerDisplayConfiguration;
}

export interface SwaggerOptions {
  title?: string;
  description?: string;
  version?: string;
  swaggerJsonEndpoint?: string;
  swaggerHtmlEndpoint?: string;
  prefix?: string;
  swaggerOptions?: any;
  swaggerConfiguration?: SwaggerConfiguration;
  [name: string]: any;
}

/**
 * 使用router响应内容
 * @param options 
 */
const handleSwagger = (options: SwaggerOptions) => {
  const {
    swaggerJsonEndpoint = '/swagger-json',
    swaggerHtmlEndpoint = '/swagger-html',
    prefix = '',
    swaggerConfiguration = {},
  } = options;

  return {
    swaggerJsonEndpoint: () => swaggerJSON(options, swaggerObject.data),
    swaggerHtmlEndpoint: () => swaggerHTML(getPath(prefix, swaggerJsonEndpoint), swaggerConfiguration)
  }
};

const handleMap = (router: SwaggerRouter, SwaggerClass: any, { isStatic = true }) => {
  if (!SwaggerClass) return;
  const classMiddlewares: any[] = SwaggerClass.middlewares || [];
  const classPrefix: string = SwaggerClass.prefix || '';

  const classParameters: any = SwaggerClass.parameters || {};
  const classParametersFilters: any[] = SwaggerClass.parameters
    ? SwaggerClass.parameters.filters
    : ['ALL'];
  classParameters.query = classParameters.query ? classParameters.query : {};

  const classInstance = isStatic ? new SwaggerClass() : SwaggerClass

  const staticMethods = Object.getOwnPropertyNames(classInstance)
    .filter(method => !reservedMethodNames.includes(method))
    .map(method => classInstance[method]);

  const SwaggerClassPrototype = SwaggerClass.prototype;
  const methods = Object.getOwnPropertyNames(SwaggerClassPrototype)
      .filter(method => !reservedMethodNames.includes(method))
      .map(method => {
        // method should not relay other proto method
        let wrapperMethod = classInstance[method];
        // 添加了一层 wrapper 之后，需要把原函数的名称暴露出来 fnName
        Object.assign(wrapperMethod, SwaggerClassPrototype[method], {fnName: method});
        return wrapperMethod;
      });

  // map all methods
  [ ...staticMethods, ...methods ]
    // filter methods withour @request decorator
    .filter((item) => {
      const { path, method } = item as { path: string, method: string };
      if (!path && !method) {
        return false;
      }
      return true;
    })
    // add router
    .forEach((item) => {
      if (item.name === 'wrapperMethod') {
        // 添加 swaggerKeys
        router._addKey(`${SwaggerClass.name}-${item.fnName}`);
      } else {
        router._addKey(`${SwaggerClass.name}-${item.name}`);

      }
      const { path, method } = item as { path: string, method: string };
      const localParams = item.parameters || {};

      if (
        classParametersFilters.includes('ALL') ||
        classParametersFilters.map(i => i.toLowerCase()).includes(method)
      ) {
        const globalQuery = R.clone(classParameters.query);
        localParams.query = localParams.query ? localParams.query : {};
        // merge local query and class query
        // local query 的优先级更高
        localParams.query = Object.assign(globalQuery, localParams.query);
      }
    });
};

const handleMapDir = (router: SwaggerRouter, dir: string, options: MapOptions) => {
  loadSwaggerClasses(dir, options).forEach((c: any) => {
    router.map(c, options);
  });
};

export interface MapOptions {
  isStatic?: boolean;
  recursive?: boolean;
  [name: string]: any;
  ignore?: string[];
}

class SwaggerRouter {
  public swaggerKeys: Set<String>;
  public swaggerOpts: SwaggerOptions;

  constructor(swaggerOpts: SwaggerOptions = {}) {
    this.swaggerKeys = new Set();
    this.swaggerOpts = swaggerOpts || {}; // swagger-router opts
  }

  _addKey(str: String) {
    this.swaggerKeys.add(str);
  }

  swagger(options: SwaggerOptions = {}) {
    const opts = Object.assign(options, this.swaggerOpts);
    handleSwagger(opts);
  }

  map(SwaggerClass: any, options: MapOptions) {
    handleMap(this, SwaggerClass, options);
  }

  mapDir(dir: string, options: MapOptions = {}) {
    handleMapDir(this, dir, options);
  }
}

export { SwaggerRouter };
