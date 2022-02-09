import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { FlowNodeAttributeOptions } from 'src/app/shared/models/flow-node-attribute-options.model';
import { FlowNodeAttributes } from 'src/app/shared/models/flow-node-attributes.model';
import { FlowStructureNode } from 'src/app/shared/models/flow-structure-node.model';
import { FlowStructureService } from 'src/app/shared/services/flow-structure.service';
import { FrankDocumentService } from 'src/app/shared/services/frank-document.service';
import { Node } from '../node/nodes/node.model';
import { CurrentFileService } from '../../shared/services/current-file.service';
import { File } from '../../shared/models/file.model';
import { ChangedAttribute } from '../../shared/models/changed-attribute.model';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
})
export class OptionsComponent implements OnInit, OnDestroy {
  public disabledAttributes = [
    'line',
    'startColumn',
    'endColumn',
    'flow:x',
    'flow:y',
  ];
  public nonRemovableAttributes = ['name', 'path'];
  public availableAttributes: FlowNodeAttributeOptions[] = [];
  public availableNestedElements?: any[];
  public attributes!: FlowNodeAttributes;
  public selectedAttribute!: any;
  public newAttributeValue!: string;
  public frankDocElement?: any;
  public frankDocParentElements: any[] = [];
  public structureNode!: FlowStructureNode;
  public frankDocElementsURI =
    environment.runnerUri + '/' + environment.frankDocElements;

  private frankDoc: any;
  private flowNode!: Node;
  private changedAttributes: ChangedAttribute[] = [];
  private currentFile!: File;
  private frankDocSubscription!: Subscription;
  private currentStructureNode!: FlowStructureNode;

  constructor(
    private ngxSmartModalService: NgxSmartModalService,
    private frankDocumentService: FrankDocumentService,
    private flowStructureService: FlowStructureService,
    private currentFileService: CurrentFileService
  ) {}

  ngOnInit(): void {
    this.getFrankDoc();
    this.getCurrentFile();
  }

  ngOnDestroy(): void {
    this.frankDocSubscription.unsubscribe();
  }

  getFrankDoc(): void {
    this.frankDocSubscription = this.frankDocumentService
      .getFrankDoc()
      .subscribe((frankDocument: any) => (this.frankDoc = frankDocument));
  }

  getCurrentFile(): void {
    this.currentFileService.currentFileObservable.subscribe({
      next: (currentFile: File) => {
        this.currentFile = currentFile;
        this.getAttributesOnNode();
      },
    });
  }

  onDataAdded(): void {
    this.flowNode = this.ngxSmartModalService.getModalData('optionsModal');
    this.resetPreviousData();
  }

  onOpen() {
    this.getAttributesOnNode();
    this.getFrankDocElement();
    this.getFrankDocParentElements(this.frankDocElement?.fullName);
    this.getAvailableAttributesForNode();
    this.getAvailableNestedElementsForNode();
  }

  onAnyCloseEvent(): void {
    this.editRelatedAttributesBasedOnName();
    this.flowStructureService.editAttributes({
      nodeId: this.flowNode.getId(),
      attributes: this.changedAttributes,
      flowUpdate: !!this.getChangedNameAttribute(),
    });
  }

  editRelatedAttributesBasedOnName(): void {
    const changedNameAttribute = this.getChangedNameAttribute();

    if (changedNameAttribute) {
      const newName = changedNameAttribute.value.toString();

      this.editConnections(newName);
      this.editFirstPipe(newName);
    }
  }

  getChangedNameAttribute(): ChangedAttribute | undefined {
    return this.changedAttributes.find(
      (attribute: ChangedAttribute) =>
        attribute.name === 'name' || attribute.name === 'path'
    );
  }

  editConnections(newName: string) {
    const sourceNodes = this.getConnectionsWithTarget();
    for (const sourceNode of sourceNodes ?? []) {
      this.flowStructureService.moveConnection(
        sourceNode.uid,
        this.flowNode.getId(),
        newName
      );
    }
  }

  getConnectionsWithTarget(): FlowStructureNode[] | undefined {
    return this.currentFile.flowStructure?.nodes.filter(
      (node: FlowStructureNode) =>
        node.forwards?.find(
          (forward) =>
            forward.attributes['path'].value === this.flowNode.getName()
        )
    );
  }

  editFirstPipe(newName: string) {
    const firstPipe =
      this.currentFile.flowStructure?.pipeline.attributes['firstPipe'];

    if (firstPipe?.value === this.flowNode.getName()) {
      this.flowStructureService.changeFirstPipe(newName);
    }
  }

  resetPreviousData() {
    this.attributes = {};
    this.changedAttributes = [];
    this.frankDocElement = '';
    this.frankDocParentElements = [];
    this.clearNewAttribute();
  }

  clearNewAttribute() {
    this.selectedAttribute = undefined;
    this.newAttributeValue = '';
  }

  getAttributesOnNode(): void {
    const node = this.currentFile.flowStructure?.nodes.find(
      (node: FlowStructureNode) => node.uid === this.flowNode?.getId()
    );

    if (node) {
      this.structureNode = node;
      this.currentStructureNode = node;
      this.attributes = node.attributes;
    }
  }

  getFrankDocElement() {
    this.frankDocElement = this.frankDoc.elements.find((element: any) =>
      element.elementNames.includes(this.structureNode?.type)
    );
  }

  getFrankDocParentElements(fullParentName: string | undefined) {
    const parent = this.frankDoc.elements.find(
      (element: any) => element.fullName === fullParentName
    );

    this.frankDocParentElements.push(parent);

    if (parent?.parent) {
      this.getFrankDocParentElements(parent.parent);
    }
  }

  getAvailableAttributesForNode(): void {
    this.availableAttributes = [];

    for (const attribute of this.frankDocElement?.attributes ?? []) {
      this.availableAttributes.push(attribute);
    }

    for (const parent of this.frankDocParentElements ?? []) {
      for (const attribute of parent.attributes ?? []) {
        if (!this.availableAttributes.includes(attribute)) {
          this.availableAttributes.push(attribute);
        }
      }
    }
  }

  getAvailableNestedElementsForNode(): void {
    this.availableNestedElements = [];

    for (const nestedElement of this.frankDocElement?.children ?? []) {
      this.availableNestedElements.push(nestedElement);
    }

    for (const parent of this.frankDocParentElements ?? []) {
      for (const nestedElement of parent.children ?? []) {
        if (!this.availableNestedElements.includes(nestedElement)) {
          this.availableNestedElements.push(nestedElement);
        }
      }
    }
  }

  addAttribute(): void {
    this.flowStructureService.createAttribute(
      {
        name: this.selectedAttribute.name,
        value: this.newAttributeValue,
      },
      this.attributes
    );
    this.clearNewAttribute();
  }

  changeAttribute(name: string, event: Event): void {
    const index = this.changedAttributes?.findIndex(
      (attribute) => attribute.name == name
    );

    const value = event as any as string | number;
    if (index !== -1) {
      this.changedAttributes[index] = { name, value };
    } else {
      this.changedAttributes.push({ name, value });
    }
  }

  deleteAttribute(key: string): void {
    setTimeout(() => {
      this.removeChangedAttribute(key);
      this.flowStructureService.deleteAttribute(key, this.attributes);
    });
  }

  removeChangedAttribute(key: string): void {
    const index = this.changedAttributes?.findIndex(
      (attribute) => attribute.name == key
    );
    this.changedAttributes.splice(index);
  }

  debounce(function_: any, wait: number): any {
    let timeout: ReturnType<typeof setTimeout> | null;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(
        () => Reflect.apply(function_, this, arguments),
        wait
      );
    };
  }

  customTrackBy(index: number, object: any): any {
    return index;
  }

  attributeIsUsed(attributeName: string | undefined): boolean {
    return Object.keys(this.attributes).includes(attributeName ?? '');
  }

  deleteNode() {
    this.flowStructureService.deleteNode(this.structureNode);
    this.ngxSmartModalService.close('optionsModal');
  }

  currentStructureNodeIs(structureNode: FlowStructureNode): boolean {
    return this.currentStructureNode === structureNode;
  }

  setCurrentStructureNode(structureNode: FlowStructureNode): void {
    this.currentStructureNode = structureNode;
  }
}
