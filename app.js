const data = {
    status: [],
    account: mwSdk.getCurrentStoredAccount(),
    sampleQuestions: [],
    currentConversation: null,
    conversationSummaries: []
  };
  
  function App(data) {
    const Status = (data) => `
      <div class="my-3">
        ${data.status.map(
          (alert) => `
            <div class="alert alert-${alert.type}">
              ${alert.message}}
            </div>
          `
        )}
      </div>
    `;
  
    const Account = (data) => `
      <div>
        <p> 
          <button class="createAccount btn btn-secondary mr-3">
            Create Account
          </button> 
          <button class="clearAccount btn btn-secondary mr-3">
            Clear Account
          </button> 
          Account: ${data.account?.getId() ?? "N/A"}
        </p>
      </div>
    `;
  
    const createAccount = () => {
      mwSdk
        .createAccount()
        .then((newAccount) => {
          data.account = newAccount;
          render(data);
        })
        .catch((error) => {
          data.status.push({ type: "danger", message: error.message });
          render(data);
        });
    };
    on("click", ".createAccount", createAccount);
    
    const clearAccount = () => {
      mwSdk.clearCurrentStoredAccount()
      data.account = null
      render(data);
    };
    on("click", ".clearAccount", clearAccount);
  
    const NewConversation = (data) => {
      return `
        <form
          class="newConversation input-group"
        >
          <input
            id="question-input"
            class="form-control"
            type="text"
            size="30"
            placeholder="Let's start a conversation"
          />
          <div class="input-group-append">
            <button class="btn btn-primary">Start</button>
          </div>
        </form>
      `
    }
    
    const newConversation = (event) => {
      event.preventDefault();
  
      const account = mwSdk.getCurrentStoredAccount();
      const intent = event.target[0].value;
  
      if (intent) {
        account
          .startConversation(intent)
          .then((conversation) => {
            data.currentConversation = conversation;
            render(data);
          })
          .catch((error) => {
            data.status.push({ type: "danger", message: error.message });
            render(data);
          });
      }
    }
    on("submit", ".newConversation", newConversation);
  
    const SampleQuestions = (data) => `
      <div class="text-center">
        ${
          data.sampleQuestions.length === 0
            ? `
        <p>
          <button class="getSampleQuestions btn btn-link">
            Sample Questions
          </button>
        </p>
        `
            : ""
        }
        ${data.sampleQuestions
          .map(
            (question) => `
            <p class="mb-0">
              <button class="startConversation btn btn-link" value="${question}">
                ${question}
              </button>
            </p>`
          )
          .join("")}
      </div>
    `;
    const getSampleQuestions = () => {
      mwSdk.getServerConfig().then((config) => {
        data.sampleQuestions = config.getSampleQuestions();
        render(data);
      });
    };
    on("click", ".getSampleQuestions", getSampleQuestions);
  
    const startConversation = (event) => {
      const intent = event.target.value;
      document.getElementById("question-input").value = intent
    };
    on("click", ".startConversation", startConversation);
  
    const Conversations = (conversationSummaries) => {
      const isActive = (id) => data.currentConversation?.getId() === id
      return `
      <div class="col-3">
        <h3>Conversations</h3>
        <div>
          <p>
            ${conversationSummaries.length || 0}
            conversations
          </p>
          <div class="list-group mb-3">
            ${conversationSummaries.map(summary => `
              <button
                class="list-group-item getConversation ${isActive(summary.getId()) ? "bg-light": ""}"
                value="${summary.getId()}"
              >
                ${summary.getIntent()}
              </button>
            `).join("")}
          </div>
          <p>
            <button
              class="getConversations btn btn-secondary"
            >
              Get Conversations
            </button>
          </p>
        </div>
      </div>`
    }
  
    const getConversations = () => {
      const account = mwSdk.getCurrentStoredAccount();
      return account
        .getConversations()
        .then((conversations) => {
          data.conversationSummaries = conversations.getConversationSummaries();
          render(data)
        })
        .catch((error) => {
          data.status.push({ type: "danger", message: error.message });
          render(data);
        });
    }
    on("click", ".getConversations", getConversations);
  
    const getConversation = (event) => {
      const account = mwSdk.getCurrentStoredAccount();
      const conversationId = event.target.value
      return account
        .getConversation(conversationId)
        .then((conversation) => {
          data.currentConversation = conversation;
          render(data)
        })
        .catch((error) => {
          data.status.push({ type: "danger", message: error.message });
          render(data);
        });
    }
    on("click", ".getConversation", getConversation);
  
    const Conversation = (conversation) => {
      if (!conversation) return "";
  
      return `
        <div
          data-conversation-id=${conversation.getId()}
          class="col-9">
          <h3>Current Conversation</h3>
          <ul>
            ${conversation
              .getInteractions()
              .map((interaction) => Interaction(interaction))
              .join("")}
          </ul>
  
          ${
            conversation.canContinue()
              ? Form(conversation.getCurrentInteraction())
              : ""
          }
        </div>
      `;
    };
  
    const Interaction = (interaction) => {
      const getAnswer = (field) => {
        const answer = field.getAnswer();
        if (typeof answer === "object") {
          return JSON.stringify(answer);
        }
        return answer;
      };
      return `
        <li
          data-interaction-id=${interaction.getId()}
          class="${interaction.isResponded() ? "text-muted" : ""}">
          <p>
          Mood: ${interaction.getMood()}
          </p>
          <p>
            ${interaction.getPrompt()}
          </p>
          ${
            interaction.getId() !==
            data.currentConversation.getCurrentInteraction().getId()
              ? `
            <ul>
              ${interaction.getFields().map(
                (field) => `
                <li>
                  ${field.getDescription() || "Answer"} : 
                  ${getAnswer(field)}
                </li>
              `
              )}
            </ul>
            `
              : ""
          }
        </li>
      `;
    };
  
    const Form = (interaction) => {
      return `
        <form 
          data-interaction-id=${interaction.getId()}
          class="submitAnswers" 
          ng-if="interaction.getType() !== 'confirmDetails'">
          ${interaction
            .getFields()
            .map((field) => `<div>${Field(field)}</div>`)
            .join("")}
  
          ${interaction
            .getFields()?.length > 0 ? 
            `<div>
              <button class="btn btn-primary">
                Submit Answer
              </button>
            </div>
            ` : ""
          }
        </form>
      `;
    };
    const submitAnswers = (e) => {
      e.preventDefault();
      render(data);
  
      data.currentConversation.submitAnswers().then((result) => {
        if (result.isSubmitted()) {
          data.currentConversation = result.getAnsweredConversation();
          render(data);
        } 
      });
    };
    on("submit", ".submitAnswers", submitAnswers);
  
    const Field = (field) => {
      const textField = () =>
        FieldGroup(
          field,
          ` 
        <input
          class="form-control enterText"
          value="${field.getAnswer() || ""}"
          placeholder="${field.getHint()}"
        />
        `
        );
  
      const multipleChoices = () =>
        FieldGroup(
          field,
          `
          <div class="form-check">
            ${field
              .getChoices()
              .map(
                (label) => `
              <p>
                <label>
                  <input
                    class="chooseAnswer form-check-input"
                    value="${label}"
                    name="${field.getId()}"
                    type="radio"
                  />
                  ${label}
                </label>
              </p>
            `
              )
              .join("")}
          </div>
        `
        );
  
      const richContentChoices = () => FieldGroup(
        field,
        `
          <div>
            <p>
              <button class="btn btn-secondary btn-sm getRichContentChoices">Load Rich Content</button>
            </p>
            <table class="table table-bordered">
              ${
                field.richContent?.map((choice, index) => `
                <tr>
                  <td>
                    <input
                      class="chooseRichContent"
                      name="${field.getId()}"
                      value="${index}"
                      type="radio"
                    />
                  </td>
                  <td>
                    <div>${choice.description}</div>
                  </td>
                  <td>
                  </td>
                </tr>
                `).join("") ?? ""
              }
              </table>
          </div>
        `)
    
      switch (field.getType()) {
        case "text":
          return textField();
        case "multipleChoices":
          return multipleChoices();
        case "multipleChoicesWithRichContent":
          return richContentChoices();
        default:
          return "";
      }
    };
  
    const _findField = (element) => {
      const fieldId = element.closest("[data-field-id]").dataset.fieldId;
      const interactionId = element.closest("[data-interaction-id]").dataset
        .interactionId;
  
      const field = data.currentConversation
        .getInteraction(interactionId)
        .getField(fieldId);
  
      return field;
    };
  
    const enterText = (event) => {
      const { target } = event;
      const field = _findField(target);
      field.validationResult = field.enter(target.value);
    };
    on("input", ".enterText", enterText);
  
    const chooseAnswer = (event) => {
      const { target } = event;
      const field = _findField(target);
      field.validationResult = field.choose(target.value);
    };
    on("click", ".chooseAnswer", chooseAnswer);
  
    const selectAnswer = (event) => {
      const { target } = event;
      const field = _findField(target);
      if (target.checked) {
        field.validationResult = field.select(target.value);
      } else {
        field.validationResult = field.deselect(target.value);
      }
    };
    on("click", ".selectAnswer", selectAnswer);
  
    const getRichContentChoices = (event) => {
      const { target } = event;
      const field = _findField(target);
      field.getRichContentChoices().then((result) => {
        field.richContent = result;
        render(data)
      });
    }
    on("click", ".getRichContentChoices", getRichContentChoices);
  
    const chooseRichContent = (event) => {
      const { target } = event;
      const field = _findField(target);
      field.choose(parseInt(target.value));
    };
    on("click", ".chooseRichContent", chooseRichContent);
  
    const FieldGroup = (field, input) => {
      return `
        <div 
          data-field-id="${field.getId()}"
          class="form-group"
          >
          ${input}
          ${
            field.validationResult?.isValid() === false
              ? `
            <p class="text-danger">
              ${field.validationResult?.getErrorMessage()}
            </p>
            `
              : ""
          }
        </div>
      `;
    };
  
    const Container = (data) => `
      <div class="container">
        ${Status(data)}
  
        <h1 class="mt-5">MyWave AI SDK Training app</h1>
  
        ${Account(data)}
  
        <div class="bg-light p-3 mb-3">
          ${NewConversation(data)}
          ${SampleQuestions(data)}
        </div>
        <div class="row">
          ${Conversations(data.conversationSummaries)}
          ${Conversation(data.currentConversation)}
        </div>
        <hr />
      </div>
    `;
  
    function render(data) {
      document.getElementById("root").innerHTML = Container(data);
    }
  
    render(data);
  }
  
  App(data);
  
  // helpers
  
  function on(eventName, elementSelector, callback) {
    const handler = (event) => {
      if (event.target.matches(elementSelector)) {
        callback(event);
      }
    };
    document.addEventListener(eventName, handler, false);
  }
  