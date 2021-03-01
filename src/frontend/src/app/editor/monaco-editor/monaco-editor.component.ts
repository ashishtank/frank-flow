/// <reference path="../../../../node_modules/monaco-editor/monaco.d.ts" />
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import { CodeService } from '../../services/code.service';

let loadedMonaco = false;
let loadPromise: Promise<void>;

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
})
export class MonacoEditorComponent
  implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  @Input() code = '';
  @Output() codeChange = new EventEmitter<string>();

  codeEditorInstance!: monaco.editor.IStandaloneCodeEditor;
  resizeInterval!: any;

  codeService: CodeService;

  constructor(private monacoElement: ElementRef, codeService: CodeService) {
    this.codeService = codeService;
  }

  ngAfterViewInit(): void {
    this.loadMonaco();
  }

  ngOnChanges(): void {
    if (this.codeEditorInstance) {
      this.codeEditorInstance.setValue(this.code);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.resizeInterval);
  }

  loadMonaco(): void {
    if (loadedMonaco) {
      loadPromise.then(() => {
        this.initializeMonaco();
      });
    } else {
      loadedMonaco = true;
      loadPromise = new Promise<void>((resolve: any) => {
        if (typeof (window as any).monaco === 'object') {
          resolve();
          return;
        }

        const onAmdLoader: any = () => {
          (window as any).require.config({ paths: { vs: 'assets/monaco/vs' } });
          (window as any).require(['vs/editor/editor.main'], () => {
            this.initializeMonaco();
            resolve();
          });
        };

        if (!(window as any).require) {
          const loaderScript: HTMLScriptElement = document.createElement(
            'script'
          );
          loaderScript.type = 'text/javascript';
          loaderScript.src = 'assets/monaco/vs/loader.js';
          loaderScript.addEventListener('load', onAmdLoader);
          document.body.appendChild(loaderScript);
        } else {
          onAmdLoader();
        }
      });
    }
  }

  initializeMonaco(): void {
    this.initializeEditor();
    this.initializeTwoWayBinding();
    this.initializeResizeInterval();
  }

  initializeEditor(): void {
    this.code = `<Configuration name="dd">
    <Adapter name="ddAdapter"> 
      <Receiver name="ddReceiver" x="681" y="24"> 
        <JavaListener name="ddListener" serviceName="ddService" />
      </Receiver>
      <Pipeline firstPipe="ddPipe">
        <FixedResultPipe name="ddPipe" returnString="Hello World" x="681" y="224">
          <Forward name="success" path="EXIT"/> 
        </FixedResultPipe>
        <FixedResultPipe name="otherPipe" returnString="Hello World">
          <Forward name="success" path="EXIT"/> 
        </FixedResultPipe> 
        <XmlSwitchPipe name="switchXML"  x="381" y="224">
          <Forward name="success" path="EXIT"/>
          <Forward name="error" path="err"/>
        </XmlSwitchPipe>
        <Exit path="EXIT" state="success" x="223" y="425"/> 
      </Pipeline> 
    </Adapter>
  </Configuration>
  `;

    this.codeEditorInstance = monaco.editor.create(
      this.editorContainer.nativeElement,
      {
        value: this.code,
        language: 'xml',
        theme: 'vs-dark',
      }
    );
    this.codeService.setEditor(this.codeEditorInstance);
  }

  initializeTwoWayBinding(): void {
    const cur = this;
    const model = this.codeEditorInstance.getModel();
    if (model) {
      model.onDidChangeContent(
        cur.debounce(
          () => {
            console.log('generate!');
            cur.codeService.setCurrentFile(cur.codeEditorInstance.getValue());
          },
          250,
          true
        )
      );
    }
  }

  debounce(func: any, wait: any, immediate: boolean): any {
    let timeout: any;
    return () => {
      const context = this;
      const args = arguments;
      const later = () => {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  }

  initializeResizeInterval(): void {
    this.resizeInterval = setInterval(() => this.onResize(), 100);
  }

  onResize(): void {
    const parentElement = this.monacoElement.nativeElement.parentElement;
    if (parentElement) {
      this.codeEditorInstance.layout({
        height: parentElement.offsetHeight,
        width:
          parentElement.offsetWidth - parentElement.children[0].offsetWidth,
      });
    }
  }
}
