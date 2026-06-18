import { Component, Input } from '@angular/core';
import { ManageComponent } from './manage.component';
import { EpisodeEditorState } from './manage.component';

@Component({
  selector: 'app-episode-form',
  templateUrl: './episode-form.component.html',
  styleUrls: ['./episode-form.component.scss']
})
export class EpisodeFormComponent {
  @Input() controller!: ManageComponent;
  @Input() editor!: EpisodeEditorState;
  @Input() compact = false;
}
