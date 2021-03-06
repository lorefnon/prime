import React, { useState } from 'react';
import { Form, Button, Input, Select, Row, Col } from 'antd';
import { toJS } from 'mobx';
import { FormComponentProps } from 'antd/lib/form';
import { camelCase, get, defaultsDeep } from 'lodash';
import { fields } from '../../../utils/fields';
import stores from '../../../stores';

const { Option } = Select;

interface IProps extends FormComponentProps {
  field: any;
  availableFields: any[];
  onCancel(): void;
  onSubmit(data: any): void;
}

const EditFieldBase = ({ form, onCancel, onSubmit, field, availableFields }: IProps) => {
  const { getFieldDecorator } = form;

  const [autoName, setAutoName] = useState(form.getFieldValue('name') === '');

  const type = form.getFieldValue('type');
  const theField = get(fields, type);
  const SchemaSettingsComponent = get(theField, 'SchemaSettingsComponent', () => null);
  const fromAvailableField = availableFields.find(f => f.id === type);

  const options = defaultsDeep(
    {},
    field ? toJS(field.options) : {},
    fromAvailableField ? toJS(fromAvailableField.defaultOptions) : {}
  );

  const onFormSubmit = async (e: any) => {
    e.preventDefault();
    const data = form.getFieldsValue();
    const result = {
      ...field,
      ...data,
    }

    if (SchemaSettingsComponent && SchemaSettingsComponent.BEFORE_SUBMIT) {
      SchemaSettingsComponent.BEFORE_SUBMIT(result.options);
    }

    await onSubmit(result);
    return false;
  }

  const onNameKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setAutoName(e.currentTarget.value === '');
  };

  const onTitleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!autoName) return;
    form.setFieldsValue({
      name: camelCase(form.getFieldValue('title')),
    });
  }

  return (
    <>
      <Form
        layout="vertical"
        hideRequiredMark
        onSubmit={onFormSubmit}
      >
        <Form.Item style={{ marginBottom: 8 }}>
          {getFieldDecorator('title', {
            rules: [{ required: true }]
          })(
            <Input
              addonBefore="Title"
              onKeyUp={onTitleKeyUp}
              placeholder="Please enter title"
              autoFocus
            />
          )}
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          {getFieldDecorator('name', {
            rules: [{
              required: true,
            }, {
              pattern: /^[A-Za-z][A-Za-z0-9_]+$/,
              message: 'Must be alphanumeric and start with non-number',
            }]
          })(
            <Input
              addonBefore="API"
              onKeyUp={onNameKeyUp}
              placeholder="Please enter api name"
            />
          )}
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          {getFieldDecorator('type', {
            rules: [{
              required: true,
            }]
          })(
            <Select placeholder="Field Type">
              {availableFields.map((field) => (
                <Option value={field.id} key={field.id}>{field.title}</Option>
              ))}
            </Select>
          )}
        </Form.Item>

        <SchemaSettingsComponent
          field={field}
          form={form}
          options={options}
          stores={stores}
        />

        <div className="prime__drawer__bottom">
          <Button style={{ marginRight: 8 }} onClick={onCancel}>Cancel</Button>
          <Button onClick={onFormSubmit} type="primary" htmlType="submit">Save</Button>
        </div>
      </Form>
    </>
  );
}

export const EditField = Form.create({
  mapPropsToFields(props: any) {
    const { field } = props;
    const res: any = {
      title: Form.createFormField({ value: field.title }),
      name: Form.createFormField({ value: field.name }),
      type: Form.createFormField({ value: field.type }),
    };

    const fromAvailableField = props.availableFields.find((f: any) => f.id === field.type);

    const options = defaultsDeep(
      get(field, 'options', {}),
      get(fromAvailableField, 'defaultOptions', {})
    );

    Object.entries(options).forEach(([key, value]) => {
      res[`options.${key}`] = Form.createFormField({ value });
    });

    res.optionsJson = Form.createFormField({ value: JSON.stringify(options) });

    return res;
  },
})(EditFieldBase);
