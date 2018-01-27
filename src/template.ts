/**
 * Copyright 2017 Oursky Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import fs from 'fs-extra';
import path from 'path';

function fileCopyFilter(src) {
  return path.basename(src) !== '.gitkeep';
}

export function cloudcode(name, dest = '.') {
  const templateDir = path.resolve(
    path.join(__dirname, '..', 'templates', `cloudcode-${name}`)
  );
  if (!fs.pathExistsSync(templateDir)) {
    throw `Template directory ${templateDir} not found.`;
  }

  const destDir = path.resolve(dest);
  fs.copySync(templateDir, destDir, {
    filter: fileCopyFilter
  });
}

export function html(dest = '.') {
  const templateDir = path.resolve(
    path.join(__dirname, '..', 'templates', 'html')
  );

  const destDir = path.resolve(dest);
  fs.copySync(templateDir, destDir, {
    filter: fileCopyFilter
  });
}
