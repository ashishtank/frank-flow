import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { ToggleComponent } from './toggle/toggle.component';
import { FormsModule } from '@angular/forms';
import { FileTreeComponent } from './file-tree/file-tree.component';
import { jqxTreeModule } from 'jqwidgets-ng/jqxtree';
import { SaveDialogComponent } from './save-dialog/save-dialog.component';
import { NgxSmartModalModule } from 'ngx-smart-modal';

@NgModule({
  declarations: [
    ButtonComponent,
    ToggleComponent,
    FileTreeComponent,
    SaveDialogComponent,
  ],
  exports: [
    ButtonComponent,
    ToggleComponent,
    FileTreeComponent,
    SaveDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    jqxTreeModule,
    NgxSmartModalModule.forChild(),
  ],
})
export class SharedModule {}