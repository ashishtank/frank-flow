import { Component } from '@angular/core';
import { NodeService } from './node/node.service';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
})
export class FlowComponent {
  nodes = [];
  connections = [];

  constructor(private nodeService: NodeService) {}
}