"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerCompleteClass = {
    container: 'Symfony\\Component\\DependencyInjection\\ContainerInterface',
    controllerContainer: 'Symfony\\Bundle\\FrameworkBundle\\Controller\\Controller',
    containerBuilder: 'Symfony\\Component\\DependencyInjection\\ContainerBuilder',
    decorator: 'Symfony\\Component\\DependencyInjection\\DefinitionDecorator',
    definition: 'Symfony\\Component\\DependencyInjection\\Definition',
    reference: 'Symfony\\Component\\DependencyInjection\\Reference'
};
class Services {
    constructor() {
        this.services = {};
        this.parameters = {};
        this.pathServices = {};
        this.pathParameters = {};
    }
    addService(key, service, path) {
        if (path) {
            this.pathServices[path] = this.pathServices[path] ? this.pathServices[path] : new Array();
            this.pathServices[path].push(service.id);
        }
        this.services[key] = service;
    }
    addServices(services, path) {
        if (path) {
            this.pathServices[path] = this.pathServices[path] ? this.pathServices[path] : new Array();
        }
        services.forEach(service => {
            this.services[service.id] = service;
            if (path) {
                this.pathServices[path].push(service.id);
            }
        });
    }
    addParameter(key, value, path) {
        if (path) {
            this.pathParameters[path] = this.pathParameters[path] ? this.pathParameters[path] : new Array();
            this.pathParameters[path].push(key);
        }
        this.parameters[key] = value;
    }
    addParameters(parameters, path) {
        if (path) {
            this.pathParameters[path] = this.pathParameters[path] ? this.pathParameters[path] : new Array();
        }
        Object.keys(parameters).forEach(key => {
            this.parameters[key] = parameters[key];
            if (path) {
                this.pathParameters[path].push(key);
            }
        });
    }
    removePathDeps(path) {
        if (this.pathParameters[path].length > 0) {
            this.pathParameters[path].forEach(element => {
                delete this.parameters[element];
            });
        }
        if (this.pathServices[path].length > 0) {
            this.pathServices[path].forEach(element => {
                delete this.services[element];
            });
        }
    }
    getServicesIds() {
        return Object.keys(this.services);
    }
    getTags() {
        let result = new Array();
        Object.keys(this.services).forEach(key => {
            console.log('sfd');
            Object.keys(this.services[key].getTags()).forEach(key => {
                if (!result.includes(key)) {
                    result.push(key);
                }
            });
        });
        return result;
    }
    getParameters() {
        return Object.keys(this.parameters);
    }
    getServiceClass(id) {
        let service = this.services[id];
        return service ? service.class : null;
    }
}
exports.Services = Services;
class Tag {
    constructor(name) {
        this.name = name;
        this.attributes = {};
    }
    addAttribute(key, value) {
        this.attributes[key] = value;
    }
}
exports.Tag = Tag;
class Service {
    constructor(id, className) {
        this.id = id;
        this.class = className;
        this.isAbstract = false;
        this.arguments = new Array();
        this.tags = {};
    }
    addArgument(key, argument) {
        this.arguments[key] = argument;
    }
    addArguments(args) {
        this.arguments = args;
    }
    addTags(tags) {
        Object.keys(tags).forEach(tag => {
            this.tags[tags[tag]['name']] = tags[tag];
        });
    }
    getTags() {
        return this.tags;
    }
    abstract() {
        this.isAbstract = true;
    }
}
exports.Service = Service;
class ServiceArgument {
    constructor(value) {
        this.value = value;
    }
}
exports.ServiceArgument = ServiceArgument;
class TextArgument {
    constructor(value) {
        this.value = value;
    }
}
exports.TextArgument = TextArgument;
class ParameterArgument {
    constructor(value) {
        this.value = value;
    }
}
exports.ParameterArgument = ParameterArgument;
class CollectionArgument {
    constructor(value) {
        this.value = value;
    }
}
exports.CollectionArgument = CollectionArgument;
//# sourceMappingURL=service.js.map