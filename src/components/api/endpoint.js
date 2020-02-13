/*
Taken from Elam Assitant by Takuya
*/

import queryString from "query-string";
import { Interface, AbstractClass } from "./lang";
import Cookies from "js-cookie";
import _ from "lodash";

import { ENV } from "../appEnv";
import { METHOD_NAMES, EXT, APIC_PATHS, APIC_API } from "./endpoint-constants";
import api from "./api";

let AppApi = Interface(
  /**
   * Returns an iterator of items from the the current selection set.
   *
   * ex.
   * for (let selection of sm.selections) { console.log(selection); }
   *
   * @returns {Iterator.<String>} iterator for list of keys from the current selection set.
   */
  METHOD_NAMES
);

class AppApiImpl extends AbstractClass(AppApi, []) {
  _get(baseUri, path, params) {
    let qs = _.isString(params)
      ? "?".concat(params)
      : params !== {}
      ? `?${queryString.stringify(params)}`
      : "";
    return api.get(`${baseUri}/${path}.${EXT}${qs}`);
  }

  _post(baseUri, path, payload) {
    return api.post(`${baseUri}/${path}.${EXT}`, payload);
  }

  _remove(baseUri, path) {
    return api.remove(`${baseUri}/${path}.${EXT}`);
  }

  get(path, params) {
    return this._get(ENV.endpointConfig.BASE_URI, path, params);
  }

  post(path, payload) {
    return this._post(ENV.endpointConfig.BASE_URI, path, payload);
  }

  getNative(path, params) {
    const self = this,
      promise = new Promise(function(resolve) {
        return self.APICProxyAuth().then(() => {
          return self
            ._get(ENV.endpointConfig.BASE_NATIVE_URI, path, params)
            .then(response => {
              resolve(response);
            });
        });
      });

    return promise;
  }

  postNative(path, payload) {
    const self = this,
      promise = new Promise(function(resolve) {
        return self.APICProxyAuth().then(() => {
          return self
            ._post(ENV.endpointConfig.BASE_NATIVE_URI, path, payload)
            .then(response => {
              resolve(response);
            });
        });
      });

    return promise;
  }

  removeNative(path) {
    const self = this,
      promise = new Promise(function(resolve) {
        return self.APICProxyAuth().then(() => {
          return self
            ._remove(ENV.endpointConfig.BASE_NATIVE_URI, path)
            .then(response => {
              resolve(response);
            });
        });
      });

    return promise;
  }

  // Using arrow function class property to bind this in the correct execution context.
  // This is needed when we pass Endpoint.api.method to chart components.
  // See https://medium.com/@rjun07a/binding-callbacks-in-react-components-9133c0b396c6

  APICProxyAuth = () => {
    const APIC_COOKIE_NAME = "APIC-Cookie";
    const apicCookie = Cookies.get(APIC_COOKIE_NAME);
    if (ENV.development) {
      return this._post(ENV.endpointConfig.BASE_NATIVE_URI, APIC_PATHS.LOGIN, {
        [APIC_API.CLASSES.USER]: {
          [APIC_API.PROPERTIES.ATTRIBUTES]: {
            [APIC_API.ATTRIBUTES.NAME]: ENV.endpointConfig.USERNAME,
            [APIC_API.ATTRIBUTES.PWD]: ENV.endpointConfig.PASSWORD
          }
        }
      })
        .then(res => {
          const token = _.get(
            res,
            [
              `${APIC_API.PROPERTIES.IMDATA}[0]`,
              APIC_PATHS.LOGIN,
              APIC_API.PROPERTIES.ATTRIBUTES,
              APIC_API.ATTRIBUTES.TOKEN
            ].join(".")
          );
          if (token) {
            // Set auth cookie in the browser
            Cookies.set(APIC_COOKIE_NAME, token);
          }

          return token;
        })
        .catch(err => {
          console.log("hiii" + err);
        });
    }

    return new Promise(function(resolve) {
      resolve(apicCookie);
    });
  };
}

class HttpAppApi extends AppApiImpl {
  getApicClass = (aciClass, params = {}) => {
    return this.getNative(`${APIC_PATHS.CLASS}/${aciClass}`, params);
  };

  fetchTopSystems = () => {
    const queryTargetFilter =
      'query-target-filter=ne(topSystem.role,"controller")';
    const rspSubtreeFull = "rsp-subtree=full";
    const rspSubtreeClass =
      "rsp-subtree-class=eqptFC,eqptLPort,firmwareRunning";
    return this.getApicClass(
      APIC_API.CLASSES.TOP_SYSTEM,
      `${queryTargetFilter}&${rspSubtreeFull}&${rspSubtreeClass}`
    );
  };

  loginCheck = (_username, _password) => {
    return this.post("loginCheck", {
      username: _username,
      password: _password
    });
  };

  test = () => {
    return this.getNative("/node/class/aaaUser");
  };
}

let httpApi;
/**
 * Expose the Endpoint API via a proxy which controls the 'api' property.
 *
 * @example
 *
 * Endpoint.api.queuesTopNodes().then(response => { ... })
 *
 * @type {Proxy}
 */
let Endpoint = new Proxy(
  {
    mock: false,
    api
  },
  {
    get: function(obj, prop) {
      // An extra property
      if (prop === "api") {
        // lazy create api
        if (!httpApi) {
          httpApi = new HttpAppApi();
        }

        return httpApi;
      }

      // The default behavior to return the value
      return obj[prop];
    },
    set: function(obj, prop, value) {
      // don't allow api prop to be set
      if (prop !== "api") {
        // The default behavior to store the value
        obj[prop] = value;

        // Indicate success
        return true;
      }

      return false;
    }
  }
);

export default Endpoint;
