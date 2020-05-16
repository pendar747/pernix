import { LitElement, property } from "lit-element";
import { on } from "../util";
import { get, isEqual } from "lodash";

export default abstract class TurboComponent extends LitElement {
  
  @property()
  model: string|null = null;

  @property()
  value: string|null = null;

  protected modelValue: any = null;
  
  protected handleStateUpdate (state: any) {
    const prevModelValue = this.modelValue;
    this.modelValue = get(state, this.model||'', null);
    if (!isEqual(this.modelValue, prevModelValue)) {
      this.performUpdate();
    }
  }

  private getModelFromValue () {
    if (!this.value) {
      return;
    }
    try {
      const valueJSON = this.value?.replace(/'/g, '"');
      this.modelValue = JSON.parse(valueJSON);
    } catch (error) {
      // console.error('failed to parse value for', this);
    }
  }

  private getStateName () {
    let stateName = null;
    let parent: Element|null|undefined = this;
    while (parent && !stateName) {
      if (parent?.hasAttribute('state')) {
        stateName = parent.getAttribute('state'); 
      } else {
        parent = parent?.parentNode instanceof ShadowRoot
          ? parent?.parentNode.host 
          : parent.parentElement;
      }
    }
    return stateName;
  }
  
  connectedCallback () {
    if (this.model) {
      const stateName = this.getStateName();
      
      if (stateName) {
        // get the initial state from local storage
        const storedState = localStorage.getItem(stateName);
        if(storedState) {
          try {
            this.handleStateUpdate(JSON.parse(storedState));
          } catch (error) {
            console.error(error);            
          }
        }
        // watch for state updates
        on(`${stateName}-state-update`, (event) => {
          this.handleStateUpdate(event.detail);
        });
      }
    }
    if (this.value) {
      this.getModelFromValue();
    }
    super.connectedCallback();
  }

}