<template>
  <div>
    <b-table
      :fields="ui.fields"
      :items="references">
      <template
        v-slot:cell(authors)="data">
        {{ getReferenceData(data.item) }}
      </template>
      <template
        v-slot:cell(stepOne)="data">
        <b-button v-b-modal.modal-1>Assess</b-button>
      </template>
      <template
        v-slot:cell(stepTwo)="data">
        <b-button>Assess</b-button>
      </template>
      <template
        v-slot:cell(stepThree)="data">
        <b-button>Assess</b-button>
      </template>
      <template
        v-slot:cell(stepFour)="data">
        <b-button>Assess</b-button>
      </template>
    </b-table>

    <b-modal id="modal-1" size="xl" hide-footer title="Methodological assessment">
      <b-row>
        <b-col cols="12">
          <b-tabs align="right">
            <template #tabs-start>
              <li role="presentation" class="nav-item mr-auto align-self-center">[[ McMillan Boyles 2011 ]]</li>
            </template>
            <b-tab active title-item-class="align-self-center">
              <template #title>
                Fit between <br/>Meta domains and <br/>Research design
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Fit between Meta domains and Research design</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Fit assessment</h3>
                  </div>
                  <div>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis qui quod unde doloremque consectetur aperiam dicta hic earum. Quasi illum quis quaerat consequuntur repellat animi asperiores aliquid ratione quia ut.</p>
                  </div>
                  <div>
                    <b-form-group label="" v-slot="{ ariaDescribedby }">
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="A">Option A</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="B">Option B</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="C">Option C</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="D">Option D</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="E">Option E</b-form-radio>
                    </b-form-group>

                    <b-form-group
                      label="Explain any concerns you have in your own words"
                      label-for="textarea-formatter">
                      <b-form-textarea
                        id="textarea-formatter"
                        v-model="text1"
                        placeholder="Enter your text"></b-form-textarea>
                    </b-form-group>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Meta domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-aa>1 - Research</h4>
                      <!-- <b-button block v-b-toggle.accordion-aa>1 - Research</b-button> -->
                    </div>
                    <b-collapse id="accordion-aa" visible accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ab>2 - Stakeholders</h4>
                      <!-- <b-button block v-b-toggle.accordion-ab>2 - Stakeholders</b-button> -->
                    </div>
                    <b-collapse id="accordion-ab" accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ac>3 - Researchers</h4>
                      <!-- <b-button block v-b-toggle.accordion-ac>3 - Researchers</b-button> -->
                    </div>
                    <b-collapse id="accordion-ac" accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ad>4 - Context</h4>
                      <!-- <b-button block v-b-toggle.accordion-ad>4 - Context</b-button> -->
                    </div>
                    <b-collapse id="accordion-ad" accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Research design domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ae>1 - Research strategy</h4>
                      <!-- <b-button block v-b-toggle.accordion-ae>1 - Research strategy</b-button> -->
                    </div>
                    <b-collapse id="accordion-ae" visible accordion="ab" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-af>2 - Ethical considerations</h4>
                      <!-- <b-button block v-b-toggle.accordion-af>2 - Ethical considerations</b-button> -->
                    </div>
                    <b-collapse id="accordion-af" accordion="ab" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ag>3 - Equity, diversity & inclusion considerations</h4>
                      <!-- <b-button block v-b-toggle.accordion-ag>3 - Equity, diversity & inclusion considerations</b-button> -->
                    </div>
                    <b-collapse id="accordion-ag" accordion="ab" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ah>4 - Theory</h4>
                      <!-- <b-button block v-b-toggle.accordion-ah>4 - Theory</b-button> -->
                    </div>
                    <b-collapse id="accordion-ah" accordion="ab" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>
                  </div>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab>
              <template #title>
                Fit between <br/>Meta domains and <br/>Research conduct
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Fit between Meta domains and Research conduct</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Fit assessment</h3>
                  </div>
                  <div>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis qui quod unde doloremque consectetur aperiam dicta hic earum. Quasi illum quis quaerat consequuntur repellat animi asperiores aliquid ratione quia ut.</p>
                  </div>
                  <div>
                    <b-form-group label="" v-slot="{ ariaDescribedby }">
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="A">Option A</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="B">Option B</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="C">Option C</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="D">Option D</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="E">Option E</b-form-radio>
                    </b-form-group>

                    <b-form-group
                      label="Explain any concerns you have in your own words"
                      label-for="textarea-formatter">
                      <b-form-textarea
                        id="textarea-formatter"
                        v-model="text1"
                        placeholder="Enter your text"></b-form-textarea>
                    </b-form-group>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Meta domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ba>1 - Research</h4>
                      <!-- <b-button block v-b-toggle.accordion-ba>1 - Research</b-button> -->
                    </div>
                    <b-collapse id="accordion-ba" visible accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bb>2 - Stakeholders</h4>
                      <!-- <b-button block v-b-toggle.accordion-bb>2 - Stakeholders</b-button> -->
                    </div>
                    <b-collapse id="accordion-bb" accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bc>3 - Researchers</h4>
                      <!-- <b-button block v-b-toggle.accordion-bc>3 - Researchers</b-button> -->
                    </div>
                    <b-collapse id="accordion-bc" accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bd>4 - Context</h4>
                      <!-- <b-button block v-b-toggle.accordion-bd>4 - Context</b-button> -->
                    </div>
                    <b-collapse id="accordion-bd" accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Research conduct domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-be>1 - Participant recruitment & selection</h4>
                      <!-- <b-button block v-b-toggle.accordion-be>1 - Participant recruitment & selection</b-button> -->
                    </div>
                    <b-collapse id="accordion-be" visible accordion="bb" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>

                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bf>2 - Data collection</h4>
                      <!-- <b-button block v-b-toggle.accordion-bf>2 - Data collection</b-button> -->
                    </div>
                    <b-collapse id="accordion-bf" accordion="bb" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>

                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bg>3 - Analysis and interpretation</h4>
                      <!-- <b-button block v-b-toggle.accordion-bg>3 - Analysis and interpretation</b-button> -->
                    </div>
                    <b-collapse id="accordion-bg" accordion="bb" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bh>4 - Presentation of findings</h4>
                      <!-- <b-button block v-b-toggle.accordion-bh>4 - Presentation of findings</b-button> -->
                    </div>
                    <b-collapse id="accordion-bh" accordion="bb" role="tabpanel">
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                    </b-collapse>
                  </div>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab>
              <template #title>
                Fit between <br/>Research design and <br/>Research conduct
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Fit between Research design and Research conduct</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Fit assessment</h3>
                  </div>
                  <div>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis qui quod unde doloremque consectetur aperiam dicta hic earum. Quasi illum quis quaerat consequuntur repellat animi asperiores aliquid ratione quia ut.</p>
                  </div>
                  <div>
                    <b-form-group label="" v-slot="{ ariaDescribedby }">
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="A">Option A</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="B">Option B</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="C">Option C</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="D">Option D</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="E">Option E</b-form-radio>
                    </b-form-group>

                    <b-form-group
                      label="Explain any concerns you have in your own words"
                      label-for="textarea-formatter">
                      <b-form-textarea
                        id="textarea-formatter"
                        v-model="text1"
                        placeholder="Enter your text"></b-form-textarea>
                    </b-form-group>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Research design domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ca>1 - Research</h4>
                    </div>
                    <b-collapse id="accordion-ca" visible accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-cb>2 - Stakeholders</h4>
                    </div>
                    <b-collapse id="accordion-cb" accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-cc>3 - Researchers</h4>
                    </div>
                    <b-collapse id="accordion-cc" accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-cd>4 - Context</h4>
                    </div>
                    <b-collapse id="accordion-cd" accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                      <h5>Concerns</h5>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                    </b-collapse>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <div>
                      <h3>Research conduct domains</h3>
                    </div>
                    <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-ce>Research strategy</h4>
                      </div>
                      <b-collapse id="accordion-ce" visible accordion="cb" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-cf>Ethical considerations</h4>
                      </div>
                      <b-collapse id="accordion-cf" accordion="cb" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-cg>Equity, diversity & inclusion  considerations</h4>
                      </div>
                      <b-collapse id="accordion-cg" accordion="cb" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-ch>Theory</h4>
                      </div>
                      <b-collapse id="accordion-ch" accordion="cb" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                    </div>
                  </div>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab title-item-class="align-self-end">
              <template #title>
                Overall assessment
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Overall assessment</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="3">
                  <div>
                    <h3>Fit assessment</h3>
                  </div>
                  <div>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis qui quod unde doloremque consectetur aperiam dicta hic earum. Quasi illum quis quaerat consequuntur repellat animi asperiores aliquid ratione quia ut.</p>
                  </div>
                  <div>
                    <b-form-group label="" v-slot="{ ariaDescribedby }">
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="A">Option A</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="B">Option B</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="C">Option C</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="D">Option D</b-form-radio>
                      <b-form-radio v-model="selected" :aria-describedby="ariaDescribedby" name="some-radios" value="E">Option E</b-form-radio>
                    </b-form-group>

                    <b-form-group
                      label="Explain any concerns you have in your own words"
                      label-for="textarea-formatter">
                      <b-form-textarea
                        id="textarea-formatter"
                        v-model="text1"
                        placeholder="Enter your text"></b-form-textarea>
                    </b-form-group>
                  </div>
                </b-col>
                <b-col cols="3">
                  <div>
                    <h3>Fit between Research design and each Meta domain</h3>
                  </div>
                  <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-da>1 - Research</h4>
                      </div>
                      <b-collapse id="accordion-da" visible accordion="da" role="tabpanel">
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-db>2 - Stakeholders</h4>
                      </div>
                      <b-collapse id="accordion-db" accordion="da" role="tabpanel">
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dc>3 - Researchers</h4>
                      </div>
                      <b-collapse id="accordion-dc" accordion="da" role="tabpanel">
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dd>4 - Context</h4>
                      </div>
                      <b-collapse id="accordion-dd" accordion="da" role="tabpanel">
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus ducimus fugit at recusandae, fuga tenetur, veniam laudantium animi eos voluptate aperiam beatae tempore odit repellat debitis quae! Eveniet, nobis sint?</p>
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil omnis error ipsa id, esse veniam soluta porro unde laborum impedit eos nemo. Ex delectus maiores aliquam fugit cupiditate soluta provident.</p>
                      </b-collapse>
                  </div>
                </b-col>
                <b-col cols="3">
                  <div>
                    <div>
                      <h3>Fit between Research conduct and each Meta domain</h3>
                    </div>
                    <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-de>Research strategy</h4>
                      </div>
                      <b-collapse id="accordion-de" visible accordion="db" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-df>Ethical considerations</h4>
                      </div>
                      <b-collapse id="accordion-df" accordion="db" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dg>Equity, diversity & inclusion  considerations</h4>
                      </div>
                      <b-collapse id="accordion-dg" accordion="db" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dh>Theory</h4>
                      </div>
                      <b-collapse id="accordion-dh" accordion="db" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                    </div>
                  </div>
                </b-col>
                <b-col cols="3">
                  <div>
                    <div>
                      <h3>Fit between Research design and Research conduct domains</h3>
                    </div>
                    <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-di>Research strategy</h4>
                      </div>
                      <b-collapse id="accordion-di" visible accordion="dc" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dj>Ethical considerations</h4>
                      </div>
                      <b-collapse id="accordion-dj" accordion="dc" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dk>Equity, diversity & inclusion  considerations</h4>
                      </div>
                      <b-collapse id="accordion-dk" accordion="dc" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dl>Theory</h4>
                      </div>
                      <b-collapse id="accordion-dl" accordion="dc" role="tabpanel">
                        <h5>Concerns</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, possimus nesciunt facilis eum veritatis dignissimos officiis, tempore quam deserunt illo optio fugit non veniam consequuntur. Animi temporibus magni error iusto!</p>
                        <h5>Extracted data</h5>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci explicabo ab id non, maxime, repellat nihil nostrum, quisquam quaerat voluptatibus debitis impedit eligendi temporibus error mollitia aperiam ducimus sit repudiandae.</p>
                      </b-collapse>
                    </div>

                  </div>
                </b-col>
              </b-row>
            </b-tab>
          </b-tabs>
        </b-col>
      </b-row>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import Commons from '../../utils/commons.js'

export default {
  name: 'StepFour',
  props: {
    type: {
      type: String,
      required: true
    },
    references: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      // Define any local data properties here if needed
      ui: {
        fields: [
          { key: 'authors', label: 'Study' },
          { key: 'stepOne', label: 'Fit between Meta domains and Research design' },
          { key: 'stepTwo', label: 'Fit between Meta domains and Research conduct' },
          { key: 'stepThree', label: 'Fit between Research design and Research conduct' },
          { key: 'stepFour', label: 'Overall assessment' }
        ]
      },
      characteristics: [],
      methodologicals: [],
      selected: null,
      text1: '',
      modal: {
        tabIndex: 0
      }
    }
  },
  computed: {
    // Define any computed properties here if needed
  },
  methods: {
    // Define any methods here if needed
    getReferenceData: function (reference) {
      return Commons.parseReference(reference, true, false)
    },
    getMethodological: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_assessments', { params })
        .then(response => {
          this.methodologicals = response.data[0]
        })
        .catch(error => {
          console.error('Error fetching methodological data:', error)
        })
    },
    getCharacteristics: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_characteristics', { params })
        .then(response => {
          this.characteristics = response.data[0]
        })
        .catch(error => {
          console.error('Error fetching characteristics:', error)
        })
    }
  }
}
</script>

<style lang="scss">

</style>
