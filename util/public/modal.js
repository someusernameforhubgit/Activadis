class ModalComponent {
    element(modal) {
        return "";
    }
}

class TextComponent extends ModalComponent {
    constructor(text) {
        super();
        this.text = text;
    }

    element(modal) {
        return `<p>${this.text}</p>`;
    }
}

class TitleComponent extends TextComponent {
    constructor(text) {
        super(text);
    }

    element(modal) {
        return `<h3>${this.text}</h3>`;
    }
}

class ButtonComponent extends ModalComponent {
    static counter = 0;
    
    constructor(text, onClick, color) {
        super();
        this.text = text;
        this.onClick = onClick;
        this.color = color;
        this.id = `button-${ButtonComponent.counter++}`;
    }

    element(modalInstance) {
        // Create a wrapper div to return the HTML string
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
          <style>
            #${this.id} {
              background-color: ${this.color || '#e6921a'};
              transition: background-color 0.2s, transform 0.2s;
            }
        
            #${this.id}:hover {
              background-color: color-mix(in srgb, ${this.color || '#e6921a'} 90%, black);
              transform: translateY(-1px);
            }
          </style>
          <button id="${this.id}">
            ${this.text}
          </button>
        `;

        // Use setTimeout to ensure the button exists in the DOM when we add the event listener
        setTimeout(() => {
            const button = document.getElementById(this.id);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof this.onClick === 'function') {
                        this.onClick(modalInstance);
                    }
                });
            }
        }, 0);
        
        return wrapper.innerHTML;
    }
}

class CloseButtonComponent extends ButtonComponent {
    constructor() {
        super("Sluiten", (modal) => modal.close(), "#bc5252");
    }
}

class InputFieldComponent extends ModalComponent {
    constructor(id, name, placeholder = "", required = false) {
        super();
        this.id = id;
        this.name = name;
        this.placeholder = placeholder;
        this.required = required;
    }

    element(modal) {
        return `<label for="${this.name}">${this.name + (this.required ? " *" : "")}</label><input id="${this.id}" type="text" name="${this.name}" placeholder="${this.placeholder}">`;
    }
}

class TextFieldComponent extends ModalComponent {
    constructor(id, name, placeholder = "", required = false) {
        super();
        this.id = id;
        this.name = name;
        this.placeholder = placeholder;
        this.required = required;
    }

    element(modal) {
        return `<label for="${this.name}">${this.name}</label><textarea id="${this.id}" name="${this.name}" placeholder="${this.placeholder}"></textarea>`;
    }
}

class RowComponent extends ModalComponent {
    constructor(fields) {
        super();
        this.fields = fields;
    }

    element(modal) {
        return `<div class="row">${this.fields.map(field => field.element(modal)).join('')}</div>`;
    }
}

class ColumnComponent extends ModalComponent {
    constructor(fields) {
        super();
        this.fields = fields;
    }

    element(modal) {
        return `<div class="column">${this.fields.map(field => field.element(modal)).join('')}</div>`;
    }
}

class HiddenComponent extends ModalComponent {
    constructor(id, value) {
        super();
        this.id = id;
        this.value = value;
    }

    element(modal) {
        return `<input id="${this.id}" type="hidden" name="${this.id}" value="${this.value}">`;
    }
}

class Modal {
    constructor(fields, id) {
        this.fields = fields;
        this.modal = null;
        this.errorMsg = null;
        this.id = id;
    }

    show() {
        const modal = document.createElement("div");
        modal.classList.add("modal");
        modal.id = this.id;
        
        const content = document.createElement("div");
        content.className = "modal-content";
        
        // Create and append each component, passing the modal instance
        this.fields.forEach(field => {
            const element = field.element(this);
            if (typeof element === 'string') {
                content.innerHTML += element;
            } else {
                content.appendChild(element);
            }
        });

        const errormsg = document.createElement("p");
        errormsg.classList.add("error");
        content.appendChild(errormsg);
        this.errorMsg = errormsg;
        
        modal.appendChild(content);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                this.close();
            }
        });
        document.body.appendChild(modal);
        document.body.style.overflow = "hidden";
        this.modal = modal;
    }

    error(text) {
        if (this.modal) {
            this.errorMsg.innerHTML = text;
            this.errorMsg.classList.add("show");
        }
    }

    hideError() {
        if (this.modal) {
            this.errorMsg.classList.remove("show");
        }
    }

    close() {
        if (this.modal) {
            this.modal.remove();
            document.body.style.overflow = "auto";
        }
    }
}

export {
    Modal,
    TextComponent,
    TitleComponent,
    InputFieldComponent,
    ButtonComponent,
    ColumnComponent,
    RowComponent,
    CloseButtonComponent,
    TextFieldComponent,
    HiddenComponent
}