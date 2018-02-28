"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phpStructure_1 = require("./phpStructure");
const services = require("../services/service");
const vscode_languageserver_1 = require("vscode-languageserver");
class AST {
    constructor(ast, path) {
        this.ast = ast;
        this.path = path;
    }
    visit(visitor) {
        if (Array.isArray(this.ast.children)) {
            this.ast.children.forEach(element => {
                visitor.visit(element);
            });
        }
    }
}
exports.AST = AST;
class ClassDeclarationVisitors {
    constructor(classDeclaration) {
        this.visitor = new ChainVisitor([new NamespaceVisitor(classDeclaration),
            new UseVisitor(classDeclaration),
            new MethodVisitor(classDeclaration),
            new ClassVisitor(classDeclaration, this),
            new PropertyVisitor(classDeclaration),
            new TraitVisitor(this)
        ]);
    }
    visit(node) {
        this.visitor.visit(node);
    }
}
exports.ClassDeclarationVisitors = ClassDeclarationVisitors;
class ChainVisitor {
    constructor(visitors) {
        this.visitors = visitors;
    }
    visit(node) {
        this.visitors.forEach(visitor => {
            visitor.visit(node);
        });
    }
}
class NamespaceVisitor {
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
    }
    visit(node) {
        if (node.kind === 'namespace') {
            this.classDeclaration.setNamespace(node.name);
        }
    }
}
class UseVisitor {
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
    }
    visit(node) {
        if (node.kind === 'usegroup') {
            node.items.forEach(item => {
                let use = new phpStructure_1.Use(item.name);
                if (item.alias) {
                    use.setAlias(item.alias);
                }
                this.classDeclaration.addUse(use);
            });
        }
    }
}
class MethodVisitor {
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
    }
    visit(node) {
        if (node.kind !== 'method') {
            return;
        }
        let start = vscode_languageserver_1.Position.create(node.loc.start.line, node.loc.start.offset);
        let end = vscode_languageserver_1.Position.create(node.loc.end.line, node.loc.end.offset);
        let func = new phpStructure_1.ClassFunction(node.name, start, end);
        if (node.visibility == 'public') {
            func.visible();
        }
        if (node.static) {
            func.static();
        }
        node.arguments.forEach(item => {
            let start = vscode_languageserver_1.Position.create(item.loc.start.line, item.loc.start.offset);
            let end = vscode_languageserver_1.Position.create(item.loc.end.line, item.loc.end.offset);
            let variable = new phpStructure_1.Variable(item.name, start, end);
            if (item.type) {
                variable.setType(item.type.name);
            }
            func.addVariable(variable);
        });
        if (node.body) {
            let visitor = new ChainVisitor([new CallVisitor(this.classDeclaration, func),
                new AssignVisitor(this.classDeclaration, func),
                new ReturnVisitor(this.classDeclaration, func)]);
            node.body.children.forEach(item => {
                visitor.visit(item);
            });
        }
        this.classDeclaration.addFunction(func);
    }
}
class ClassVisitor {
    constructor(classDeclaration, visitors) {
        this.classDeclaration = classDeclaration;
        this.visitors = visitors;
    }
    visit(node) {
        if (node.kind !== 'class') {
            return;
        }
        let start = vscode_languageserver_1.Position.create(node.loc.start.line, node.loc.start.offset);
        let end = vscode_languageserver_1.Position.create(node.loc.end.line, node.loc.end.offset);
        this.classDeclaration.setName(node.name);
        this.classDeclaration.setPosition(start, end);
        if (node.implements) {
            node.implements.forEach(item => {
                this.classDeclaration.addInterface(item);
            });
        }
        if (node.extends) {
            this.classDeclaration.setParent(node.extends.name);
        }
        if (node.isAbstract) {
            this.classDeclaration.abstract();
        }
        if (node.body) {
            this.visitors.visit(node.body);
        }
    }
}
class PropertyVisitor {
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
    }
    visit(node) {
        if (node.kind === 'property') {
            let start = vscode_languageserver_1.Position.create(node.loc.start.line, node.loc.start.offset);
            let end = vscode_languageserver_1.Position.create(node.loc.end.line, node.loc.end.offset);
            let variable = new phpStructure_1.Variable(node.name, start, end);
            this.classDeclaration.addVariable(variable);
        }
    }
}
class TraitVisitor {
    constructor(visitors) {
        this.visitors = visitors;
    }
    visit(node) {
        if (node.kind === 'trait' && node.body) {
            this.visitors.visit(node.body);
        }
    }
}
class CallVisitor {
    constructor(classDeclaration, classFunction) {
        this.classDeclaration = classDeclaration;
        this.classFunction = classFunction;
    }
    visit(node) {
        if (node.kind !== 'call') {
            return;
        }
        if (node.what.kind == 'propertylookup') {
            if (node.what.what.kind == "variable") {
                let name = node.what.what.name;
                let type = this.classFunction.getVariableType(name);
                let fqn = this.classDeclaration.getFQNFromName(type);
                if (fqn && fqn == services.containerCompleteClass.containerBuilder) {
                    let funcName = node.what.offset.name;
                    if (funcName == 'setDefinition') {
                        if (node.arguments[0].kind == 'string') {
                            this.classDeclaration.addService(node.arguments[0].value);
                        }
                        if (node.arguments[0].kind == 'variable') {
                            let variable = this.classFunction.getVariable(node.arguments[0].name);
                            if (variable.getValue()) {
                                this.classDeclaration.addService(variable.getValue());
                            }
                        }
                    }
                    if (funcName == 'setParameter') {
                        if (node.arguments[0].kind == 'string') {
                            this.classDeclaration.addParameter(node.arguments[0].value);
                        }
                    }
                }
            }
        }
    }
}
class AssignVisitor {
    constructor(classDeclaration, classFunction) {
        this.classDeclaration = classDeclaration;
        this.classFunction = classFunction;
    }
    visit(node) {
        if (node.kind !== 'assign') {
            return;
        }
        if (node.left && node.left.kind == "propertylookup" &&
            node.left.what.name == 'this') {
            if (node.right.kind == 'variable') {
                let type = this.classFunction.getVariableType(node.right.name);
                if (type) {
                    this.classDeclaration.setPropertyType(node.left.offset.name, type);
                }
            }
        }
        if (node.left && node.left.kind == "variable") {
            let start = vscode_languageserver_1.Position.create(node.loc.start.line, node.loc.start.offset);
            let end = vscode_languageserver_1.Position.create(node.loc.end.line, node.loc.end.offset);
            let variable = new phpStructure_1.Variable(node.left.name, start, end);
            if (node.right && node.right.kind == "new") {
                if (node.right.what && node.right.what.name) {
                    if (node.right.what.kind == "identifier") {
                        variable.setType(node.right.what.name);
                    }
                }
            }
            if (node.right.kind == "string") {
                variable.setValue(node.right.value);
            }
            this.classFunction.addVariable(variable);
        }
    }
}
class ReturnVisitor {
    constructor(classDeclaration, classFunction) {
        this.classDeclaration = classDeclaration;
        this.classFunction = classFunction;
    }
    visit(node) {
    }
}
//# sourceMappingURL=visitor.js.map