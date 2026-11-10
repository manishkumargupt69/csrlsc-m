interface FormDataFile {
  uri: string;
  name: string;
  type: string;
  sizeBytes?: number;
}

export const appendFormDataFile = ({
  formData,
  fieldName,
  file,
}: {
  formData: FormData;
  fieldName: string;
  file: FormDataFile;
}): void => {
  formData.append(fieldName, file as unknown as Blob);
};
