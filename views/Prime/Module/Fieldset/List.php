<div class="fullscreen-ui">
	<div class="navbar navbar-toolbar">
		<div class="btn-toolbar">
			<div class="btn-group">
				<?=HTML::anchor('Prime/Module/Fieldset/Create/'.$fieldset->id, __('Create'), [
					'onclick' => 'return prime.view(this.href);',
					'class'   => 'btn btn-danger'
				]);?>
			</div>
			<div class="btn-group table-bind-template">
			</div>
    		<script id="selTemplate" type="text/x-handlebars-template">
				<a href="/Prime/Module/Fieldset/Edit/{{id}}" onclick="return {{#if one}}prime.view(this.href){{else}}false{{/if}};" class="btn btn-default{{#more}} disabled{{/more}}{{#zero}} disabled{{/zero}}">
					<i class="icon-edit"></i>&nbsp; <?=__('Edit');?>
				</a>
				<a href="/Prime/Module/Fieldset/Delete/{{id}}" onclick="return {{#if zero}}false{{else}}prime.fieldset.delete(this){{/if}};" class="btn btn-default{{#zero}} disabled{{/zero}}">
					<i class="icon-trash"></i>&nbsp; <?=__('Delete');?>
				</a>
    		</script>
		</div>
	</div>
	<div class="scrollable">
		<table class="table table-hover table-condensed table-selection table-sortable" data-bind-template="#selTemplate" data-bind=".table-bind-template">
			<thead>
				<tr>
					<th width="30" class="text-center" data-sorter="false"><?=Form::checkbox(NULL, NULL, FALSE, ['class' => 's']);?></th>
					<?php foreach ($fields as $field): ?>
						<th><?=$field->caption;?></th>
					<?php endforeach; ?>
				</tr>
			</thead>
			<tbody>
				<?php foreach ($fieldset->items->find_all() as $item): ?>
					<tr ondblclick="prime.view('/Prime/Module/Fieldset/Edit/<?=$item->id;?>');" onselectstart="return false;" data-id="<?=$item->id;?>">
						<td class="text-center"><?=Form::checkbox(NULL, NULL, FALSE, ['class' => 's']);?></td>
						<?php foreach ($fields as $field): ?>
							<td><?=$field->field->as_text($item);?></td>
						<?php endforeach; ?>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>
</div>