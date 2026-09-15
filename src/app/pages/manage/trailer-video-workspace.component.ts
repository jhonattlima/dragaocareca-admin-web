import { Component, Input } from '@angular/core';
import { ManageComponent, EpisodeEditorState } from './manage.component';

@Component({
  selector: 'app-trailer-video-workspace',
  templateUrl: './trailer-video-workspace.component.html',
  styleUrls: ['./trailer-video-workspace.component.scss'],
})
export class TrailerVideoWorkspaceComponent {
  @Input() controller!: ManageComponent;
  @Input() editor!: EpisodeEditorState;
}
